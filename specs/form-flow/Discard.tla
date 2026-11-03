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
\* TRUE: both sides decide from top-level endings only (getEndingRouteFields and the
\* filter in isSubmissionDiscarded).  FALSE: the code as #387 shipped it, where the
\* renderer passed [...allFields, ...thankYouFields] and allFields keeps nested endings.
TopLevelEndingsOnly    == Form.topLevelEndingsOnly
\* TRUE: the time limit shows the ending its route resolves (Header.tsx).  FALSE: #387,
\* which passed it only when the route discarded.
CountdownShowsEnding   == Form.countdownShowsEnding

\* ---------------------------------------------------------------------------
\* The two projections (Renderer.tsx initStore + Form.tsx / isSubmissionDiscarded)
\*
\* The renderer's allFields = flattenFieldsWithGroups(parseFields(fields) without
\* welcome/thank-you), minus payment fields when Stripe is off.  The top-level filter
\* only removes top-level endings, so an ending nested in a group stays in allFields at
\* its group's position; resolveEnding() is then called with allFields followed by the
\* top-level endings.  The *order* matters: resolveEnding() falls back to the first
\* ending of the list it is given.
\* ---------------------------------------------------------------------------
ClientSees(omitPay, f) ==
  /\ Kind[f] \in FORM_KINDS
  /\ Kind[f] # "welcome"
  /\ (Kind[f] # "payment" \/ ~omitPay)
  /\ (Kind[f] # "group" \/ ~EmptyGroup[f])

TopLevelEnding(f) == Kind[f] = "thank_you" /\ TopLevel[f]

\* allFields, in document order (nested endings included, top-level endings not)
ClientAllFields(omitPay) ==
  SelectSeq(Order, LAMBDA f : ClientSees(omitPay, f) /\ ~TopLevelEnding(f))

ClientOrder(omitPay) ==
  LET all == IF TopLevelEndingsOnly
             THEN SelectSeq(ClientAllFields(omitPay), LAMBDA f : Kind[f] # "thank_you")
             ELSE ClientAllFields(omitPay)
  IN all \o SelectSeq(Order, LAMBDA f : TopLevelEnding(f))

ServerSees(f) ==
  /\ Kind[f] \in FORM_KINDS
  /\ (Kind[f] # "group" \/ ~ServerDropsEmptyGroups \/ ~EmptyGroup[f])
  /\ (Kind[f] # "thank_you" \/ TopLevel[f] \/ ~TopLevelEndingsOnly)

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
      passed == IF submitPath = "countdown" /\ ~CountdownShowsEnding
                   /\ ~IsDiscard(ClientOrder(omitPayment), vals, isPartial)
                THEN "none"
                ELSE resolved
  IN IF passed \in {f \in EndingSet(ClientOrder(omitPayment)) : DisplayableEnding(f)}
     THEN passed
     ELSE "none"

\* ===========================================================================
\* completeSubmission: validate, decide, store - in that order
\* ===========================================================================
\* The route completeSubmission validates: applyLogicToFields over
\* flattenFields(form.fields, true) in document order (the walk stops at the first
\* ending it reaches), then selectSubmissionFields.  A partial submission must stop at a
\* jump field the answers did not resolve; one that has none is rejected
\* ("Invalid partial submission").
ServerWalk(vals) == Replay(Order, Kind, vals)

PartialHasTerminal(vals) ==
  \E i \in 1..Len(ServerWalk(vals)) :
    ServerWalk(vals)[i] \in JumpFields /\ ~TouchedOf(Order, ServerWalk(vals)[i], vals)

ServerRoute(vals, isPartial) == SliceByLogics(Order, ServerWalk(vals), vals, isPartial)

AllAnswersValid(vals, isPartial) ==
  LET sub == ServerRoute(vals, isPartial) IN
  /\ (isPartial => PartialHasTerminal(vals))
  /\ \A i \in 1..Len(sub) :
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
  \* Header.tsx always submits the time limit as a partial submission
  /\ (path = "countdown" => partial)

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

\* The other direction of NoDataLoss: the renderer and the server resolve the *same*
\* ending from the same answers (the server's projection without payment fields when
\* Stripe is off).  NoDataLoss alone cannot catch a renderer that discards a response
\* the server would keep, because the renderer then never sends it.
EndingsAgree ==
  ~VarHasRules =>
    ClientEnding(values, partial)
      = EndingFor(IF omitPayment THEN ServerNoPayOrder ELSE ServerOrder, values, partial)

\* So the renderer only drops a response the server would have dropped too.
ClientDiscardIsServerDiscard ==
  ~VarHasRules /\ ClientDiscard(values, partial) =>
    IsDiscard(IF omitPayment THEN ServerNoPayOrder ELSE ServerOrder, values, partial)

\* Pre-existing (not #387): when the time runs out, Header.tsx sends what was answered as
\* a partial submission, but the server only accepts a partial submission that stops at
\* a jump field the answers did not resolve.  So on a route whose jump questions are all
\* answered (or a form without jumps) the response is rejected although every answer in
\* it is valid.  Expected to fail; see MCCountdownRejected.cfg.
AnsweredAreValid(vals) ==
  \A i \in 1..Len(ServerWalk(vals)) :
    LET q == ServerWalk(vals)[i] IN
    Kind[q] \notin QUESTION_KINDS \/ AcceptAs(Kind, q, FALSE, vals[q])

CountdownIsAccepted ==
  path = "countdown" /\ ~ClientDiscard(values, partial) /\ AnsweredAreValid(values) =>
    Outcome(values, partial) # "rejected"

================================================================================
