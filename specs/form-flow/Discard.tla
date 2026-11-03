-------------------------------- MODULE Discard --------------------------------
\* PR #387: an ending screen can keep its responses out of the form.
\*
\*   resolveEnding()            answer-utils/src/resolve-ending.ts
\*   isSubmissionDiscarded()    server/src/utils/submission.ts
\*   Form.tsx / Header.tsx      the renderer's decision and the screen it shows
\*
\* Both sides decide from the *same* answer map but from different projections of
\* the form: the renderer passes the fields it can show (no payment fields when
\* Stripe is off), the server passes every form field except empty groups.  This
\* module compares the two decisions for every possible answer map.
\*
\* The property that matters is one-directional: the server may keep a response
\* the renderer would have discarded (that is deliberate), but it must never
\* discard one the respondent saw as saved.
\* -------------------------------------------------------------------------------

EXTENDS FormDomain

VARIABLES values, partial, omitPayment, path

\* Which submission paths the config explores: {"submit"} (the form's own submit
\* button), {"countdown"} (the time limit), or both.
CONSTANT SubmitPaths

\* ---------------------------------------------------------------------------
\* Facts about the form this feature depends on
\* ---------------------------------------------------------------------------
DiscardEnding == Form.discardEnding   \* ending -> properties.discardSubmission
TopLevel      == Form.topLevel        \* field sits at the top level of the document
EmptyGroup    == Form.emptyGroup      \* group with no form fields inside
VarHasRules   == Form.varHasRules     \* some variable carries logic
ServerDropsEmptyGroups == Form.serverDropsEmptyGroups

\* ---------------------------------------------------------------------------
\* The two projections (Renderer.tsx initStore / isSubmissionDiscarded)
\*
\* ClientSees: allFields = flattenFieldsWithGroups(parseFields(fields) without
\* welcome/thank-you), minus payment fields when Stripe is off, plus the
\* top-level endings.
\* ---------------------------------------------------------------------------
ClientSees(omitPay, f) ==
  /\ Kind[f] \in FORM_KINDS
  /\ Kind[f] # "welcome"
  /\ (Kind[f] # "payment" \/ ~omitPay)
  /\ (Kind[f] # "group" \/ ~EmptyGroup[f])

ServerSees(f) ==
  /\ Kind[f] \in FORM_KINDS
  /\ (Kind[f] # "group" \/ ~ServerDropsEmptyGroups \/ ~EmptyGroup[f])

ClientOrder(omitPay) == SelectSeq(Order, LAMBDA f : ClientSees(omitPay, f))
ServerOrder             == SelectSeq(Order, LAMBDA f : ServerSees(f))
ServerNoPayOrder        == SelectSeq(ServerOrder, LAMBDA f : Kind[f] # "payment")

\* ---------------------------------------------------------------------------
\* resolveEnding()
\* ---------------------------------------------------------------------------
Questions(order) == SelectSeq(order, LAMBDA f : Kind[f] \notin {"welcome", "thank_you"})
Endings(order)   == SelectSeq(order, LAMBDA f : Kind[f] = "thank_you")
EndingSet(order) == {Endings(order)[i] : i \in 1..Len(Endings(order))}

\* resolveEnding() walks [...questions, ...thankYouFields].
ResolveOrder(order) == Questions(order) \o Endings(order)

\* Fields the form gives jump logic to; sliceFieldsByLogics only cuts on these.
JumpFields == {f \in Ids : \E i \in 1..Len(Payloads(f)) : Payloads(f)[i].kind = "navigate"}

\* applyLogicToFields sets isTouched: the last navigate rule decides, and a rule
\* that does not match falls back to "the field is validly answered".
RECURSIVE TouchedFrom(_, _, _, _, _)
TouchedFrom(order, fid, i, vals, acc) ==
  LET ps == Payloads(fid) IN
  IF i > Len(ps) THEN acc
  ELSE LET p == ps[i] IN
       IF p.kind # "navigate" THEN TouchedFrom(order, fid, i + 1, vals, acc)
       ELSE IF Holds(Kind, fid, p.cond, vals)
            THEN IF ValidTarget(order, Kind, fid, p.to)
                 THEN TRUE                      \* the walk jumps here and stops
                 ELSE TouchedFrom(order, fid, i + 1, vals, TRUE)
            ELSE TouchedFrom(order, fid, i + 1, vals, RequiredValid(Kind, fid, vals))

TouchedOf(order, fid, vals) == TouchedFrom(order, fid, 1, vals, FALSE)

\* sliceFieldsByLogics(): cut after the first jump field the route did not reach.
RECURSIVE SliceFrom(_, _, _, _)
SliceFrom(order, walk, i, vals) ==
  IF i > Len(walk) THEN walk
  ELSE IF walk[i] \in JumpFields /\ ~TouchedOf(order, walk[i], vals)
       THEN SubSeq(walk, 1, i)
       ELSE SliceFrom(order, walk, i + 1, vals)

SliceByLogics(order, walk, vals, isPartial) ==
  IF isPartial THEN SliceFrom(order, walk, 1, vals) ELSE walk

EndingFor(order, vals, isPartial) ==
  LET o    == ResolveOrder(order)
      walk == Replay(o, Kind, vals)
      sub  == SliceByLogics(o, walk, vals, isPartial)
      last == sub[Len(sub)]
      target == IF Len(sub) = 0 THEN "none" ELSE EndingTarget(o, Kind, last, vals)
  IN IF target \in EndingSet(order) THEN target
     ELSE IF Len(Endings(order)) > 0 THEN Endings(order)[1]
     ELSE "none"

IsDiscard(order, vals, isPartial) ==
  LET e == EndingFor(order, vals, isPartial) IN
  e # "none" /\ DiscardEnding[e]

\* ---------------------------------------------------------------------------
\* The two decisions
\* ---------------------------------------------------------------------------
ClientEnding(vals, isPartial) == EndingFor(ClientOrder(omitPayment), vals, isPartial)
ClientDiscard(vals, isPartial) == IsDiscard(ClientOrder(omitPayment), vals, isPartial)

ServerDiscard(vals, isPartial) ==
  LET hasDiscardingEnding == \E f \in Ids : Kind[f] = "thank_you" /\ DiscardEnding[f] IN
  /\ hasDiscardingEnding
  /\ ~VarHasRules
  /\ IsDiscard(ServerOrder, vals, isPartial)
  /\ IsDiscard(ServerNoPayOrder, vals, isPartial)

\* ---------------------------------------------------------------------------
\* What the respondent sees
\*
\* Form.tsx passes the resolved ending; Header.tsx (time limit) passes it only
\* when it discards.  Blocks.tsx then looks the id up in state.thankYouFields,
\* which only holds top-level endings, and falls back to a generic screen.
\* ---------------------------------------------------------------------------
DisplayableEnding(f) == Kind[f] = "thank_you" /\ TopLevel[f]

ShownEnding(submitPath, vals, isPartial) ==
  LET resolved == ClientEnding(vals, isPartial)
      passed == IF submitPath = "countdown" /\ ~IsDiscard(ClientOrder(omitPayment), vals, isPartial)
                THEN "none"
                ELSE resolved
  IN IF passed \in {f \in EndingSet(ClientOrder(omitPayment)) : DisplayableEnding(f)}
     THEN passed
     ELSE "none"

\* ===========================================================================
\* completeSubmission: validate, decide, store - in that order
\* ===========================================================================
ServerRoute(vals, isPartial) ==
  LET o == ResolveOrder(ServerOrder) IN
  SliceByLogics(o, Replay(o, Kind, vals), vals, isPartial)

AllAnswersValid(vals, isPartial) ==
  LET sub == ServerRoute(vals, isPartial) IN
  \A i \in 1..Len(sub) :
    Kind[sub[i]] \notin QUESTION_KINDS \/ Accept(Kind, sub[i], vals[sub[i]])

Outcome(vals, isPartial) ==
  IF ~AllAnswersValid(vals, isPartial) THEN "rejected"
  ELSE IF ServerDiscard(vals, isPartial) THEN "discarded"
  ELSE "stored"

\* ===========================================================================
\* State: every answer map, both submission paths, both payment setups.
\* ===========================================================================
Vars == <<values, partial, omitPayment, path>>

Init ==
  /\ values \in [Ids -> SentValues]
  /\ partial \in BOOLEAN
  /\ omitPayment \in BOOLEAN
  /\ path \in SubmitPaths

Next == UNCHANGED Vars

Spec == Init /\ [][Next]_Vars

\* ===========================================================================
\* Invariants
\* ===========================================================================

\* The server never drops a response the renderer would have saved.
NoDataLoss ==
  Outcome(values, partial) = "discarded" => ClientDiscard(values, partial)

\* A discarded submission was validated first: nothing is silently thrown away
\* that would have been rejected with an error.
DiscardedIsValidated ==
  Outcome(values, partial) = "discarded" => AllAnswersValid(values, partial)

\* The respondent is shown the ending the decision was made from.  Expected to
\* fail for an ending nested in a group and on the countdown path; see
\* MCDiscardShown.cfg.
ShownIsResolved ==
  ShownEnding(path, values, partial) = ClientEnding(values, partial)

\* Nothing is saved on a route whose screen told the respondent otherwise.
ShownSavingWhenSaved ==
  Outcome(values, partial) = "stored" =>
    (ShownEnding(path, values, partial) = "none"
     \/ DiscardEnding[ShownEnding(path, values, partial)] = FALSE)

HasDiscardingEnding == \E f \in Ids : Kind[f] = "thank_you" /\ DiscardEnding[f]

================================================================================
