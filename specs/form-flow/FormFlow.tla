------------------------------- MODULE FormFlow -------------------------------
\* State machine: a respondent filling in a form, the builder changing a field's
\* kind, and the server replay that turns the answer map into a submission.
\*
\* Safety:  every stored answer has the shape its own kind promises (the
\*          submissions table dereferences those shapes), the flow only ever
\*          moves forward, and an answer whose kind no longer matches its field
\*          is never handed to the field's renderer.
\* Liveness: under weak fairness on Leave every run reaches the end of the form
\*           (the walk is a bounded, strictly increasing subsequence of Order).
\* -------------------------------------------------------------------------------

EXTENDS FormDomain

VARIABLES values, vars, cursor, visited, phase, archive, lastResult, kind, changed

Vars == <<values, vars, cursor, visited, phase, archive, lastResult, kind, changed>>

Init ==
  /\ values = EmptyValues
  /\ vars = VarInit
  /\ cursor = Order[1]
  /\ visited = <<>>
  /\ phase = "filling"
  /\ archive = {}
  /\ lastResult = "none"
  /\ kind = Kind
  /\ changed = FALSE

\* ---------------------------------------------------------------------------
\* The environment: the respondent (or an attacker with the endpoint open)
\* posts any JSON value for a field.
\*
\* EnvMode = "honest"  : only the field on screen can be answered.
\* EnvMode = "hostile" : any field, any time, with any value in SentValues.
\* ---------------------------------------------------------------------------
Answer(fid, v) ==
  /\ phase = "filling"
  /\ fid \in Ids
  /\ kind[fid] \in QUESTION_KINDS
  /\ (EnvMode = "hostile" \/ fid = cursor)
  /\ v \in SentValues
  /\ values' = [values EXCEPT ![fid] = v]
  /\ UNCHANGED <<vars, cursor, visited, phase, archive, lastResult, kind, changed>>

AnswerSome == \E fid \in Ids, v \in SentValues : Answer(fid, v)

\* ---------------------------------------------------------------------------
\* The client leaves the current screen: run this field's calculate rules, then
\* follow its first matching jump or the default next position.
\* ---------------------------------------------------------------------------
Leave ==
  /\ phase = "filling"
  /\ kind[cursor] # "thank_you"
  /\ LET d == Destination(Order, kind, cursor, values)
     IN /\ visited' = Append(visited, cursor)
        /\ vars' = CalcVars(kind, cursor, vars, values)
        /\ IF d = "end"
           THEN phase' = "done" /\ UNCHANGED cursor
           ELSE cursor' = d /\ UNCHANGED phase
  /\ UNCHANGED <<values, archive, lastResult, kind, changed>>

\* ---------------------------------------------------------------------------
\* The builder saves a new question type for a field
\* (Builder/RightSidebar/Question/TypeSwitcher.tsx).  Existing answers keep the
\* kind they were validated with; nothing rewrites history.
\* ---------------------------------------------------------------------------
ChangeFieldKind(fid, k) ==
  /\ fid \in MutableFields
  /\ k \in MutableKinds
  /\ k \in QUESTION_KINDS
  /\ kind[fid] # k
  /\ kind' = [kind EXCEPT ![fid] = k]
  /\ changed' = TRUE
  /\ UNCHANGED <<values, vars, cursor, visited, phase, archive, lastResult>>

ChangeSome == \E fid \in Ids, k \in MutableKinds : ChangeFieldKind(fid, k)

\* ---------------------------------------------------------------------------
\* The server: replay the whole form from the first field using the submitted
\* answers and the form as it is published now, validate every visited question
\* and persist the answers with their kind snapshot.
\* (completeSubmission -> applyLogicToFields -> fieldValuesToAnswers)
\* ---------------------------------------------------------------------------
Submit ==
  /\ phase = "done"
  /\ LET walk   == Replay(Order, kind, values)
         qs     == WalkQuestions(walk)
         ok     == \A fid \in {qs[i] : i \in 1..Len(qs)} : Accept(kind, fid, values[fid])
         answers == AnswersOf(Order, kind, values)
         agrees == visited = walk
         stable == ~changed
     IN /\ lastResult' = IF ok THEN "accepted" ELSE "rejected"
        /\ archive' = IF ok
                      THEN archive \cup
                             {[answers |-> answers, variables |-> vars,
                               walk |-> walk, agrees |-> agrees,
                               stable |-> stable, kinds |-> kind]}
                      ELSE archive
        /\ phase' = "submitted"
  /\ UNCHANGED <<values, vars, cursor, visited, kind, changed>>

\* Keep a terminal state from looking like a deadlock; any other stuck state is
\* a real deadlock and TLC reports it.
Halt ==
  /\ phase = "submitted"
  /\ UNCHANGED Vars

Next == AnswerSome \/ Leave \/ ChangeSome \/ Submit \/ Halt

\* Fairness only on Leave: a run may stutter in "done" instead of submitting,
\* which is enough for Termination and keeps TLC's tableau small.
Spec == Init /\ [][Next]_Vars /\ WF_Vars(Leave)

\* ===========================================================================
\* Form configuration, as published right now
\* ===========================================================================
Config_OrderSound     == Check_OrderSound(kind)
Config_NextTargets    == Check_NextTargets(Order, kind)
Config_BranchCoverage == Check_BranchCoverage(kind)
Config_RulesReachable == Check_RulesReachable(kind)
Config_CalcTyped      == Check_CalcTyped(kind)
Config_VarInit        == Check_VarInit

\* ===========================================================================
\* Safety
\* ===========================================================================
StoredAnswers ==
  UNION { { s.answers[i] : i \in 1..Len(s.answers) } : s \in archive }

\* The flow never revisits a field and never goes backwards.
Flow_ForwardOnly ==
  \A i \in 1..(Len(visited) - 1) : Pos(Order, visited[i]) < Pos(Order, visited[i + 1])

\* A thank-you screen is never answered and never part of the walk.
Flow_NoTerminalVisit == \A i \in 1..Len(visited) : kind[visited[i]] # "thank_you"

\* Statement screens are shown but never stored.
Answer_NoStatementAnswers ==
  \A a \in StoredAnswers : a.kind \in QUESTION_KINDS

\* The answer snapshot's kind is the field's kind.  Only true while the form is
\* not edited; see Drift_RenderSafe for the edited case.
Answer_KindMatchesField ==
  \A a \in StoredAnswers : a.kind = kind[a.fid]

\* The anti-crash invariant: every stored value has a shape its own kind
\* promises, so SubmissionCell/answer-parser never dereference a missing shape.
Answer_TypeSafe ==
  \A a \in StoredAnswers : a.value \in TypeSafeUnder(a.kind, a.fid)

\* The strict version: no normalisation, no coercion.  Expected to fail on
\* unanswered optional object/number kinds; see MCStrict.cfg.
Answer_StrictlyTyped ==
  \A a \in StoredAnswers : a.value \in FieldDomainUnder(a.kind, a.fid)

\* Answers are exactly the visited questions, in walk order, each once.
Answer_FollowsWalk ==
  \A s \in archive :
    LET qs == WalkQuestions(s.walk) IN
    /\ Len(s.answers) = Len(qs)
    /\ \A i \in 1..Len(qs) : s.answers[i].fid = qs[i]

Answer_IdsUnique ==
  \A s \in archive :
    \A i, j \in 1..Len(s.answers) : s.answers[i].fid = s.answers[j].fid => i = j

\* Required questions of the walk carry a non-empty answer.
Answer_RequiredAnswered ==
  \A s \in archive :
    \A i \in 1..Len(s.answers) :
      Required[s.answers[i].fid] => ~IsEmptyVal(s.answers[i].value)

\* Choice answers stay inside the declared options.
Answer_ChoiceSound ==
  \A s \in archive :
    \A i \in 1..Len(s.answers) :
      LET a == s.answers[i] IN
      a.kind \in CHOICE_KINDS =>
        /\ a.value.tag = "multi"
        /\ a.value.sel \subseteq Choices[a.fid]
        /\ (AllowOther[a.fid] \/ a.value.other = "")
        /\ (AllowMultiple[a.fid]
            \/ Cardinality(a.value.sel) + (IF a.value.other # "" THEN 1 ELSE 0) <= 1)

\* Variables never change type, whatever the answers are.
Var_Typed ==
  \A v \in DOMAIN VarKind :
    (VarKind[v] = "number" => vars[v] \in Int)
    /\ (VarKind[v] = "string" => vars[v] \in VarTexts)

Var_ArchivedTyped ==
  \A s \in archive :
    \A v \in DOMAIN VarKind :
      (VarKind[v] = "number" => s.variables[v] \in Int)
      /\ (VarKind[v] = "string" => s.variables[v] \in VarTexts)

\* The client's own walk and the server's replay of the same answers agree,
\* unless the form was edited while the respondent was filling it in.
Client_MatchesServer ==
  \A s \in archive : ~s.stable \/ s.agrees

\* ===========================================================================
\* Schema drift: the form was edited after submissions exist
\* ===========================================================================

\* Each answer was validated against the kinds published when it was submitted,
\* and a later edit never rewrites it.
Drift_StoredKindSnapshot ==
  \A s \in archive :
    \A i \in 1..Len(s.answers) :
      s.answers[i].kind = s.kinds[s.answers[i].fid]

\* The submissions table dispatches on the field's *current* kind and only reads
\* the value when the answer's kind still matches
\* (`answer.kind !== field.kind` in SubmissionCell).  Whenever it reads a value,
\* the value has the shape of that kind - so no cell can crash after an edit.
Drift_RenderSafe ==
  \A a \in StoredAnswers :
    a.kind = kind[a.fid] => a.value \in TypeSafeUnder(a.kind, a.fid)

\* Drop that guard and the same submissions would feed a renderer a value of a
\* different kind.  Expected to fail as soon as a kind changes; see
\* MCDriftUnguarded.cfg.
Drift_UnguardedWouldCrash ==
  \A a \in StoredAnswers : a.value \in TypeSafeUnder(kind[a.fid], a.fid)

\* ===========================================================================
\* Liveness
\* ===========================================================================
\* TLC checks this as Spec => Termination.
Termination == <>[](phase \in {"done", "submitted"})

================================================================================
