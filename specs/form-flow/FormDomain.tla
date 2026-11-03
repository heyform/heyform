----------------------------- MODULE FormDomain -----------------------------
\* Pure model of a HeyForm form: field kinds, the value domain of every kind,
\* answer validation, condition evaluation, calculate actions and the navigation
\* function.
\*
\* Everything here mirrors code under packages/answer-utils/src plus
\* packages/server/src/resolver/endpoint/complete-submission.resolver.ts and
\* packages/server/src/utils/submission.ts.  See README.md for the mapping.
\*
\* The whole form under test is one constant, `Form`, so a model module only has
\* to define that record (see MCModel.tla) and every config is a substitution.
\*
\* Operators that depend on a field's kind take the *current* kind map as their
\* first argument, because a form's kinds can change after submissions exist
\* (FormFlow's ChangeFieldKind action).  `Check_*(kinds)` are the form-level
\* configuration checks; FormFlow wraps them in state invariants.
\* -----------------------------------------------------------------------------

EXTENDS Naturals, Integers, Sequences, FiniteSets, TLC

CONSTANT Form

\* ---------------------------------------------------------------------------
\* Form under test (fields of `Form` are documented in README.md)
\* ---------------------------------------------------------------------------
Ids             == Form.ids
Order           == Form.order
Kind            == Form.kind          \* the kind map the form was published with
Required        == Form.required
NextId          == Form.next
Choices         == Form.choices
AllowOther      == Form.allowOther
AllowMultiple   == Form.allowMultiple
AllowBlankOther == Form.allowBlankOther
Total           == Form.total
Logics          == Form.logics
BranchByAnswer  == Form.branchByAnswer
MutableFields   == Form.mutableFields \* fields whose kind the builder may change
MutableKinds    == Form.mutableKinds  \* kinds such a field may be switched to
VarKind         == Form.varKind
VarInit         == Form.varInit
VarTexts        == Form.varTexts
TextVals        == Form.textVals
NumVals         == Form.numVals
DateSeq         == Form.dateSeq
ChoiceSets      == Form.choiceSets
OtherTexts      == Form.otherTexts
ObjShapes       == Form.objShapes
RowShapes       == Form.rowShapes
ChoiceIds       == Form.choiceIds
OtherChoice     == Form.otherChoice
EnvMode         == Form.envMode
SentAll         == Form.sentAll
AttackVals      == Form.attackVals

\* ---------------------------------------------------------------------------
\* Kinds (FieldKindEnum)
\* ---------------------------------------------------------------------------
QUESTION_KINDS ==
  {"short_text", "long_text", "number", "yes_no", "multiple_choice",
   "picture_choice", "file_upload", "rating", "opinion_scale", "date",
   "date_range", "input_table", "full_name", "address", "email", "url",
   "phone_number", "country", "signature", "legal_terms", "payment"}

STATEMENT_KINDS == {"welcome", "thank_you", "statement", "group"}

\* validateCondition() switches on these kind groups.
COND_TEXT_KINDS   == {"short_text", "long_text", "phone_number", "email", "url"}
COND_CHOICE_KINDS == {"multiple_choice", "picture_choice"}
COND_BOOL_KINDS   == {"yes_no", "legal_terms"}
COND_NUMBER_KINDS == {"number", "rating", "opinion_scale"}
COND_NO_LOGIC_KINDS == {"welcome", "thank_you", "statement", "group"}

CHOICE_KINDS == {"multiple_choice", "picture_choice"}

\* FORM_FIELD_KINDS: what a form may contain, i.e. what the renderer keeps.
FORM_KINDS == QUESTION_KINDS \cup STATEMENT_KINDS

\* ---------------------------------------------------------------------------
\* Values
\*
\* A value is one record with a fixed shape; `tag` says what the respondent
\* actually sent and every payload lives in its own field.  Keeping one shape
\* lets TLC compare any two values, and `tag` is the only thing validation may
\* trust.
\* ---------------------------------------------------------------------------
Blank ==
  [tag |-> "", text |-> "", num |-> 0, flag |-> FALSE, choice |-> "",
   sel |-> {}, other |-> "", start |-> "", end |-> "", shape |-> ""]

Nil             == [Blank EXCEPT !.tag = "nil"]
Text(s)         == [Blank EXCEPT !.tag = "text", !.text = s]
Num(n)          == [Blank EXCEPT !.tag = "num", !.num = n]
Bool(b)         == [Blank EXCEPT !.tag = "bool", !.flag = b]
Single(c)       == [Blank EXCEPT !.tag = "single", !.choice = c]
Multi(sel, o)   == [Blank EXCEPT !.tag = "multi", !.sel = sel, !.other = o]
Pair(s, e)      == [Blank EXCEPT !.tag = "pair", !.start = s, !.end = e]
Obj(sh)         == [Blank EXCEPT !.tag = "obj", !.shape = sh]
Rows(sh)        == [Blank EXCEPT !.tag = "rows", !.shape = sh]
SelSet(sel)     == [Blank EXCEPT !.tag = "selset", !.sel = sel]   \* in conditions

DateVals == {DateSeq[i] : i \in 1..Len(DateSeq)}

\* Every JSON shape a respondent can post, including the ones no field wants.
Universe ==
    {Nil}
  \cup {Text(s) : s \in TextVals}
  \cup {Num(n) : n \in NumVals}
  \cup {Bool(b) : b \in BOOLEAN}
  \cup {Single(c) : c \in ChoiceIds \cup {OtherChoice}}
  \cup {Multi(s, o) : s \in ChoiceSets, o \in OtherTexts}
  \cup {Pair(s, e) : s \in DateVals, e \in DateVals}
  \cup {Obj(sh) : sh \in ObjShapes}
  \cup {Rows(sh) : sh \in RowShapes}

\* What the environment may actually send in a given config.
SentValues == IF SentAll THEN Universe ELSE AttackVals

\* Convenience constructors so model authors write rules, not records.
Nav(cmp, expected, to) ==
  [kind |-> "navigate", cond |-> [cmp |-> cmp, expected |-> expected], to |-> to]
Nav0(cmp, to) ==
  [kind |-> "navigate", cond |-> [cmp |-> cmp], to |-> to]
Calc(cmp, var, op, operand) ==
  [kind |-> "calculate", cond |-> [cmp |-> cmp], var |-> var, op |-> op,
   operand |-> operand]
CalcV(cmp, expected, var, op, operand) ==
  [kind |-> "calculate", cond |-> [cmp |-> cmp, expected |-> expected],
   var |-> var, op |-> op, operand |-> operand]
Const(n) == [type |-> "const", value |-> n]
Ref(f) == [type |-> "ref", field |-> f]

\* ---------------------------------------------------------------------------
\* String helpers (TLA+ strings are sequences of characters)
\* ---------------------------------------------------------------------------
Digits == {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

IsDigits(s) == Len(s) > 0 /\ \A i \in 1..Len(s) : SubSeq(s, i, i) \in Digits
NumericTexts == {s \in TextVals : IsDigits(s)}

RECURSIVE DigitsValue(_)
DigitsValue(s) ==
  IF Len(s) = 0 THEN 0
  ELSE DigitsValue(SubSeq(s, 1, Len(s) - 1)) * 10
       + (CHOOSE n \in 0..9 : ToString(n) = SubSeq(s, Len(s), Len(s)))

\* JS parseInt(): leading digits, or -1 for "not a number".
RECURSIVE LeadingDigits(_)
LeadingDigits(s) ==
  IF Len(s) = 0 THEN ""
  ELSE IF SubSeq(s, 1, 1) \in Digits
       THEN SubSeq(s, 1, 1) \o LeadingDigits(SubSeq(s, 2, Len(s)))
  ELSE ""

ParseIntHead(s) == IF LeadingDigits(s) = "" THEN -1 ELSE DigitsValue(LeadingDigits(s))

IsSubstring(sub, s) ==
  LET m == Len(sub) IN
  IF m > Len(s) THEN FALSE
  ELSE \E i \in 1..(Len(s) - m + 1) : SubSeq(s, i, i + m - 1) = sub

StartsWith(a, b) == Len(b) <= Len(a) /\ SubSeq(a, 1, Len(b)) = b
EndsWith(a, b)   == Len(b) <= Len(a) /\ SubSeq(a, Len(a) - Len(b) + 1, Len(a)) = b

\* String(value) for the scalar shapes; objects and arrays stringify to
\* something we never match against, modelled as "".
ToText(v) ==
  CASE v.tag = "nil"    -> ""
    [] v.tag = "text"   -> v.text
    [] v.tag = "num"    -> ToString(v.num)
    [] v.tag = "bool"   -> IF v.flag THEN "true" ELSE "false"
    [] v.tag = "single" -> v.choice
    [] OTHER            -> ""

\* ---------------------------------------------------------------------------
\* Shape predicates
\* ---------------------------------------------------------------------------
IsNilVal(v) == v.tag = "nil"

\* helper.isEmpty()
IsEmptyVal(v) ==
  CASE v.tag = "nil"    -> TRUE
    [] v.tag = "text"   -> v.text = ""
    [] v.tag = "num"    -> FALSE
    [] v.tag = "bool"   -> FALSE
    [] v.tag = "single" -> v.choice = ""
    [] v.tag = "multi"  -> v.sel = {} /\ v.other = ""
    [] v.tag = "pair"   -> FALSE
    [] v.tag = "obj"    -> v.shape = "empty"
    [] v.tag = "rows"   -> v.shape = "empty"
    [] OTHER            -> FALSE

\* Number(value) when it is finite, else -1.
NumberOf(v) ==
  IF v.tag = "num" THEN v.num
  ELSE IF v.tag = "text" /\ v.text \in NumericTexts THEN DigitsValue(v.text)
  ELSE -1

IsNumericVal(v) == v.tag = "num" \/ (v.tag = "text" /\ v.text \in NumericTexts)

\* parseInt(value) - no tag check at all, exactly like validateInt().
IntOf(v) ==
  IF v.tag = "num" THEN v.num
  ELSE IF v.tag = "text" THEN ParseIntHead(v.text)
  ELSE -1

DateIn(s)  == s \in DateVals
DateOrd(s) == IF DateIn(s) THEN CHOOSE i \in 1..Len(DateSeq) : DateSeq[i] = s ELSE 0

\* ---------------------------------------------------------------------------
\* Field domains
\*
\* FieldDomainUnder: what a field of this kind is supposed to store.
\* TypeSafeUnder:    FieldDomain plus the two normalisations
\*                   fieldValuesToAnswers() performs (an unanswered optional
\*                   field is stored as "", a number/rating may be stored as
\*                   numeric text).  SubmissionCell guards every shape outside
\*                   its own domain, so staying inside TypeSafe is what keeps
\*                   the submissions table from crashing.
\*
\* Both take the kind explicitly: an answer is always checked against the kind
\* it was validated with, which is not necessarily the field's current kind.
\* ---------------------------------------------------------------------------
FieldDomainUnder(k, fid) ==
  CASE k \in {"short_text", "long_text", "email", "url", "phone_number",
              "country", "date", "signature"} -> {Text(s) : s \in TextVals}
    [] k = "number" -> {Num(n) : n \in NumVals}
    [] k \in {"rating", "opinion_scale"} -> {Num(n) : n \in 1..Total[fid]}
    [] k = "yes_no" -> {Single(c) : c \in Choices[fid]}
    [] k \in CHOICE_KINDS ->
         {Multi(sel, o) : sel \in SUBSET Choices[fid],
                          o \in IF AllowOther[fid] THEN OtherTexts ELSE {""}}
    [] k = "legal_terms" -> {Bool(b) : b \in BOOLEAN}
    [] k = "date_range" -> {Pair(s, e) : s \in DateVals, e \in DateVals}
    [] k = "file_upload" -> {Text(s) : s \in TextVals} \cup {Obj("complete")}
    [] k \in {"full_name", "address", "payment"} -> {Obj("complete")}
    [] k = "input_table" -> {Rows(sh) : sh \in RowShapes}
    [] OTHER -> {}

TypeSafeUnder(k, fid) ==
  FieldDomainUnder(k, fid)
  \cup {Text("")}
  \cup (IF k \in {"number", "rating", "opinion_scale"}
       THEN {Text(s) : s \in NumericTexts}
       ELSE {})

FieldDomain(kinds, fid) == FieldDomainUnder(kinds[fid], fid)
TypeSafe(kinds, fid)    == TypeSafeUnder(kinds[fid], fid)

\* ---------------------------------------------------------------------------
\* validate() - the server gate.  Faithful to packages/answer-utils/src/validate.ts
\* including its coercions (isNumeric(String(v)), parseInt, no tag checks).
\* ---------------------------------------------------------------------------
MultiOk(fid, v) ==
  LET sel        == v.sel
      blankOther == AllowOther[fid] /\ AllowBlankOther[fid] /\ v.other = ""
      hasOther   == blankOther \/ v.other # ""
      count      == Cardinality(sel) + (IF hasOther THEN 1 ELSE 0)
  IN /\ Cardinality(sel) > 0 \/ hasOther                 \* "This field is required"
     /\ AllowOther[fid] \/ v.other = ""                  \* "Other value is not allowed"
     /\ AllowMultiple[fid] \/ count <= 1                 \* "Multiple choose is not allowed"
     /\ sel \subseteq Choices[fid]                       \* "non-specified choices"

PairOk(v) ==
  DateIn(v.start) /\ DateIn(v.end) /\ DateOrd(v.start) <= DateOrd(v.end)

TypeOkUnder(k, fid, v) ==
  CASE k \in {"short_text", "long_text", "country"} -> v.tag = "text"
    [] k = "email" ->
         v.tag = "text" /\ v.text \in {s \in TextVals : IsSubstring("@", s)}
    [] k = "url" ->
         v.tag = "text" /\ (StartsWith(v.text, "http") \/ StartsWith(v.text, "https"))
    [] k = "phone_number" -> v.tag = "text" /\ IsDigits(v.text)
    [] k = "number" -> IsNumericVal(v)                  \* isNumeric(String(value))
    [] k \in {"rating", "opinion_scale"} -> IntOf(v) \in 1..Total[fid]
    [] k = "yes_no" -> v.tag = "single" /\ v.choice \in Choices[fid]
    [] k \in CHOICE_KINDS -> v.tag = "multi" /\ MultiOk(fid, v)
    [] k = "legal_terms" -> v.tag = "bool"
    [] k = "date" -> v.tag = "text" /\ DateIn(v.text)
    [] k = "date_range" -> v.tag = "pair" /\ PairOk(v)
    [] k = "file_upload" ->
         (v.tag = "text" /\ StartsWith(v.text, "http"))
         \/ (v.tag = "obj" /\ v.shape = "complete")
    [] k = "signature" -> v.tag = "text" /\ v.text # ""
    [] k \in {"full_name", "address"} -> v.tag = "obj" /\ v.shape = "complete"
    [] k = "payment" -> v.tag = "obj" /\ v.shape = "complete"
    [] k = "input_table" -> v.tag = "rows"
    [] OTHER -> FALSE

\* The required/nil gate first, then the per-kind type check.
AcceptAs(kinds, fid, required, v) ==
  IF kinds[fid] \notin QUESTION_KINDS THEN TRUE
  ELSE CASE ~required /\ IsNilVal(v) -> TRUE
         [] required /\ IsEmptyVal(v) -> FALSE
         [] OTHER -> TypeOkUnder(kinds[fid], fid, v)

Accept(kinds, fid, v) == AcceptAs(kinds, fid, Required[fid], v)

\* validateRequiredField(): the same field, with required forced on.
RequiredValid(kinds, fid, values) == AcceptAs(kinds, fid, TRUE, values[fid])

\* ---------------------------------------------------------------------------
\* validateCondition() - total: every comparison on every value answers a
\* boolean, unsupported comparisons are simply false (never an exception).
\* ---------------------------------------------------------------------------
\* isEqual() stringifies with String(), so an unanswered field is "undefined";
\* isContains()/isStartsWith() use a helper that turns nil into "".
JsString(v) == IF IsNilVal(v) THEN "undefined" ELSE ToText(v)
Eq(a, b) == JsString(a) = JsString(b)

TextHolds(c, v) ==
  CASE c.cmp = "is"                -> Eq(v, c.expected)
    [] c.cmp = "is_not"            -> ~Eq(v, c.expected)
    [] c.cmp = "contains"          -> IsSubstring(ToText(c.expected), ToText(v))
    [] c.cmp = "does_not_contain"  -> ~IsSubstring(ToText(c.expected), ToText(v))
    [] c.cmp = "starts_with"       -> StartsWith(ToText(v), ToText(c.expected))
    [] c.cmp = "ends_with"         -> EndsWith(ToText(v), ToText(c.expected))
    [] OTHER                       -> FALSE

ExpectedText(c) ==
  IF c.expected.tag = "selset"
  THEN IF Cardinality(c.expected.sel) = 1
       THEN CHOOSE x \in c.expected.sel : TRUE
       ELSE "?"
  ELSE ToText(c.expected)

ChoiceHolds(c, v) ==
  LET sel        == IF v.tag = "multi" THEN v.sel ELSE {}
      other      == IF v.tag = "multi" THEN v.other ELSE ""
      mentionsOt == (c.expected.tag = "selset" /\ OtherChoice \in c.expected.sel)
                    \/ (c.expected.tag = "single" /\ c.expected.choice = OtherChoice)
      otherPart  == IF mentionsOt THEN (IF other = "" THEN {} ELSE {OtherChoice}) ELSE {other}
      effective  == (sel \cup otherPart) \ {""}
      expected   == IF c.expected.tag = "selset" THEN c.expected.sel
                    ELSE IF c.expected.tag = "single" THEN {c.expected.choice}
                    ELSE {}
      isEq       == Cardinality(effective) = Cardinality(expected)
                    /\ \A x \in effective : x \in expected
  IN CASE c.cmp = "is"               -> isEq
       [] c.cmp = "is_not"           -> ~isEq
       [] c.cmp = "contains"         -> ExpectedText(c) \in effective
       [] c.cmp = "does_not_contain" -> ~(ExpectedText(c) \in effective)
       [] OTHER                      -> FALSE

BoolHolds(c, v) ==
  CASE c.cmp = "is"     -> Eq(v, c.expected)
    [] c.cmp = "is_not" -> ~Eq(v, c.expected)
    [] OTHER            -> FALSE

NumHolds(c, v) ==
  LET a == NumberOf(v)
      b == NumberOf(c.expected)
      ok == IsNumericVal(v) /\ IsNumericVal(c.expected)
  IN CASE c.cmp = "equal"                 -> ok /\ a = b
       [] c.cmp = "not_equal"             -> ok /\ a # b
       [] c.cmp = "greater_than"          -> ok /\ a > b
       [] c.cmp = "less_than"             -> ok /\ a < b
       [] c.cmp = "greater_or_equal_than" -> ok /\ a >= b
       [] c.cmp = "less_or_equal_than"    -> ok /\ a <= b
       [] OTHER                           -> FALSE

DateHolds(c, v) ==
  LET ok == v.tag = "text" /\ DateIn(v.text)
            /\ c.expected.tag = "text" /\ DateIn(c.expected.text)
  IN CASE c.cmp = "is"        -> ok /\ v.text = c.expected.text
       [] c.cmp = "is_not"    -> ~(ok /\ v.text = c.expected.text)
       [] c.cmp = "is_before" -> ok /\ DateOrd(v.text) < DateOrd(c.expected.text)
       [] c.cmp = "is_after"  -> ok /\ DateOrd(v.text) > DateOrd(c.expected.text)
       [] OTHER               -> FALSE

DefaultHolds(c, v) ==
  CASE c.cmp = "is_empty"     -> IsEmptyVal(v)
    [] c.cmp = "is_not_empty" -> ~IsEmptyVal(v)
    [] OTHER                  -> FALSE

HoldsOnUnder(k, c, v) ==
  IF k \in COND_TEXT_KINDS THEN TextHolds(c, v)
  ELSE IF k \in COND_CHOICE_KINDS THEN ChoiceHolds(c, v)
  ELSE IF k \in COND_BOOL_KINDS THEN BoolHolds(c, v)
  ELSE IF k \in COND_NUMBER_KINDS THEN NumHolds(c, v)
  ELSE IF k = "date" THEN DateHolds(c, v)
  ELSE IF k \in COND_NO_LOGIC_KINDS THEN FALSE
  ELSE DefaultHolds(c, v)

\* Logic rules only ever read the field they are attached to.
Holds(kinds, fid, c, values) == HoldsOnUnder(kinds[fid], c, values[fid])

\* ---------------------------------------------------------------------------
\* Navigation (packages/answer-utils/src/navigation.ts)
\* ---------------------------------------------------------------------------
\* Everything below takes the field order explicitly: the renderer and the server
\* pass different projections of the form (see Discard.tla).
\* 0 means "not in this order", like indexOf() returning -1: the renderer and the
\* server pass different projections, so a nextFieldId may name a field the other
\* side cannot see.
Pos(order, fid) ==
  IF \E i \in 1..Len(order) : order[i] = fid
  THEN CHOOSE i \in 1..Len(order) : order[i] = fid
  ELSE 0

IsJumpable(kinds, fid) == kinds[fid] \notin {"welcome", "group", "thank_you"}

ValidTarget(order, kinds, from, to) ==
  /\ to \in Ids
  /\ Pos(order, from) < Pos(order, to)
  /\ IsJumpable(kinds, from)
  /\ kinds[to] # "welcome"

Payloads(fid) == IF fid \in Ids /\ Logics[fid] # <<>> THEN Logics[fid] ELSE <<>>

NavigatePayloads(fid) ==
  { p \in {Payloads(fid)[i] : i \in 1..Len(Payloads(fid))} : p.kind = "navigate" }

CalculatePayloads(fid) ==
  { p \in {Payloads(fid)[i] : i \in 1..Len(Payloads(fid))} : p.kind = "calculate" }

DefaultNextIndex(order, kinds, i) ==
  LET f == order[i] IN
  IF kinds[f] = "thank_you" THEN Len(order) + 1
  ELSE LET cand == IF NextId[f] = "none" \/ NextId[f] \notin Ids THEN 0
                  ELSE Pos(order, NextId[f]) IN
       IF cand > 0 /\ ValidTarget(order, kinds, f, order[cand]) THEN cand ELSE i + 1

RECURSIVE FirstJumpFrom(_, _, _, _, _)
FirstJumpFrom(order, kinds, fid, i, values) ==
  LET ps == Payloads(fid) IN
  IF i > Len(ps) THEN "none"
  ELSE LET p == ps[i] IN
       IF p.kind = "navigate" /\ Holds(kinds, fid, p.cond, values)
          /\ ValidTarget(order, kinds, fid, p.to)
       THEN p.to
       ELSE FirstJumpFrom(order, kinds, fid, i + 1, values)

FirstJump(order, kinds, fid, values) == FirstJumpFrom(order, kinds, fid, 1, values)

NextIndexFrom(order, kinds, fid, values) ==
  LET j == FirstJump(order, kinds, fid, values) IN
  IF j # "none" THEN Pos(order, j) ELSE DefaultNextIndex(order, kinds, Pos(order, fid))

\* "end" means the walk stops here (next position is past the last field or is a
\* thank-you screen, which applyLogicToFields breaks on without pushing).
Destination(order, kinds, fid, values) ==
  LET ni == NextIndexFrom(order, kinds, fid, values) IN
  IF ni > Len(order) \/ kinds[order[ni]] = "thank_you" THEN "end" ELSE order[ni]

\* The ending this field leads to, if it leads to one directly.
EndingTarget(order, kinds, fid, values) ==
  LET ni == NextIndexFrom(order, kinds, fid, values) IN
  IF ni <= Len(order) /\ kinds[order[ni]] = "thank_you" THEN order[ni] ELSE "none"

\* ---------------------------------------------------------------------------
\* calculateAction()
\* ---------------------------------------------------------------------------
\* Operands are values too, so the tag still says what kind of thing the rule
\* points at.  A calculate action only fires when the operand has the type the
\* variable needs (isNumber/isNil in calculate-action.ts).
OperandValue(op, values) ==
  IF op.type = "const" THEN op.value
  ELSE IF op.field \in Ids THEN values[op.field]
  ELSE op.value

RawOf(v) == IF v.tag = "text" THEN v.text ELSE v

ApplyCalc(p, vars, values) ==
  IF p.var \notin DOMAIN vars THEN vars
  ELSE LET cur == vars[p.var]
           raw == OperandValue(p.operand, values)
       IN IF VarKind[p.var] = "number"
          THEN IF raw.tag # "num" THEN vars
               ELSE [vars EXCEPT ![p.var] =
                       CASE p.op = "assign" -> raw.num
                         [] p.op = "add"  -> cur + raw.num
                         [] p.op = "sub"  -> cur - raw.num
                         [] p.op = "mul"  -> cur * raw.num
                         [] p.op = "div"  -> IF raw.num = 0 THEN cur
                                              ELSE cur \div raw.num
                         [] OTHER         -> cur]
          ELSE IF raw.tag = "nil" THEN vars
               ELSE IF p.op = "assign" THEN [vars EXCEPT ![p.var] = RawOf(raw)]
               ELSE IF cur \in VarTexts /\ raw.tag = "text"
                    THEN [vars EXCEPT ![p.var] = cur \o raw.text]
               ELSE vars

RECURSIVE CalcFrom(_, _, _, _, _)
CalcFrom(kinds, fid, i, vars, values) ==
  LET ps == Payloads(fid) IN
  IF i > Len(ps) THEN vars
  ELSE LET p == ps[i] IN
       CalcFrom(kinds, fid, i + 1,
                IF p.kind = "calculate" /\ Holds(kinds, fid, p.cond, values)
                THEN ApplyCalc(p, vars, values)
                ELSE vars,
                values)

\* Variables start from the published values and every calculate rule of every
\* visited field is applied in order.
CalcVars(kinds, fid, vars, values) == CalcFrom(kinds, fid, 1, vars, values)

\* ---------------------------------------------------------------------------
\* Replay: the server's authoritative walk for a complete answer map.
\* applyLogicToFields() starts at index 0 and only ever moves forward.
\* ---------------------------------------------------------------------------
RECURSIVE ReplayFrom(_, _, _, _)
ReplayFrom(order, kinds, i, values) ==
  IF i > Len(order) THEN <<>>
  ELSE IF kinds[order[i]] = "thank_you" THEN <<>>
  ELSE LET fid == order[i]
           d   == Destination(order, kinds, fid, values)
       IN IF d = "end" THEN <<fid>> ELSE <<fid>> \o ReplayFrom(order, kinds, Pos(order, d), values)

Replay(order, kinds, values) == ReplayFrom(order, kinds, 1, values)

\* fieldValuesToAnswers(): empty answers are normalised, blank "other" dropped.
DropBlankOther(kinds, fid, v) ==
  IF kinds[fid] \in CHOICE_KINDS /\ v.tag = "multi" /\ v.other = ""
     /\ ~(AllowOther[fid] /\ AllowBlankOther[fid])
  THEN Multi(v.sel, "")
  ELSE v

StoredValue(kinds, fid, v) ==
  LET s == IF IsEmptyVal(v)
           THEN IF kinds[fid] \in CHOICE_KINDS THEN Multi({}, "") ELSE Text("")
           ELSE v
  IN DropBlankOther(kinds, fid, s)

\* Question-ness is invariant under a kind edit (MutableKinds only contains
\* question kinds), so the published Kind map can be used here.
WalkQuestions(walk) ==
  SelectSeq(walk, LAMBDA f : Kind[f] \in QUESTION_KINDS)

RECURSIVE AnswersFrom(_, _, _, _)
AnswersFrom(order, kinds, i, values) ==
  LET walk == Replay(order, kinds, values) IN
  IF i > Len(walk) THEN <<>>
  ELSE LET fid == walk[i] IN
       IF Kind[fid] \in QUESTION_KINDS
       THEN <<[fid |-> fid, kind |-> kinds[fid],
               value |-> StoredValue(kinds, fid, values[fid])]>>
            \o AnswersFrom(order, kinds, i + 1, values)
       ELSE AnswersFrom(order, kinds, i + 1, values)

AnswersOf(order, kinds, values) == AnswersFrom(order, kinds, 1, values)

\* A value map in which every field is unanswered.
EmptyValues == [f \in Ids |-> Nil]

\* ===========================================================================
\* Configuration checks: properties of the form as it is published *now*.
\* ===========================================================================

\* The form order is a permutation of the field ids and ends on a thank-you.
Check_OrderSound(kinds) ==
  /\ Len(Order) > 0
  /\ \A i, j \in 1..Len(Order) : Order[i] = Order[j] => i = j
  /\ Ids = {Order[i] : i \in 1..Len(Order)}
  /\ kinds[Order[Len(Order)]] = "thank_you"

\* Every default next-field and every jump target exists and moves forward.
Check_NextTargets(order, kinds) ==
  \A f \in Ids :
    (NextId[f] = "none"
     \/ (NextId[f] \in Ids /\ ValidTarget(order, kinds, f, NextId[f])))
    /\ \A p \in NavigatePayloads(f) :
         p.to \in Ids /\ ValidTarget(order, kinds, f, p.to)

\* Branching is only active while the field is still a choice question; every
\* answer of such a question needs its own destination.
Check_BranchCoverage(kinds) ==
  \A f \in Ids :
    BranchByAnswer[f] /\ kinds[f] \in {"yes_no", "multiple_choice", "picture_choice"} =>
      /\ Required[f]
      /\ ~AllowMultiple[f]
      /\ \A c \in Choices[f] \cup (IF AllowOther[f] THEN {OtherChoice} ELSE {}) :
           \E p \in NavigatePayloads(f) :
             p.cond.cmp = "is" /\ ExpectedText(p.cond) = c

\* Some value the referenced field can actually hold.
FieldKindProbe(kinds, fid) ==
  IF FieldDomain(kinds, fid) = {} THEN Nil
  ELSE CHOOSE v \in FieldDomain(kinds, fid) : TRUE

\* No dead rule: every jump/calculate rule can fire for some answer of its field
\* under the field's *current* kind.
Check_RulesReachable(kinds) ==
  \A f \in Ids :
    \A i \in 1..Len(Payloads(f)) :
      \E v \in FieldDomain(kinds, f) :
        HoldsOnUnder(kinds[f], Payloads(f)[i].cond, v)

\* Calculate actions write the right kind of variable from the right kind of
\* value, under the fields' current kinds.
Check_CalcTyped(kinds) ==
  \A f \in Ids :
    \A p \in CalculatePayloads(f) :
      /\ p.var \in DOMAIN VarKind
      /\ (VarKind[p.var] = "number" =>
            /\ p.op \in {"assign", "add", "sub", "mul", "div"}
            /\ (p.operand.type = "const" => p.operand.value.tag = "num")
            /\ (p.operand.type = "ref" =>
                  p.operand.field \in Ids
                  /\ IsNumericVal(FieldKindProbe(kinds, p.operand.field))))
      /\ (VarKind[p.var] = "string" =>
            /\ p.op \in {"assign", "add"}
            /\ (p.operand.type = "const" => p.operand.value.tag = "text")
            /\ (p.operand.type = "ref" =>
                  p.operand.field \in Ids
                  /\ FieldKindProbe(kinds, p.operand.field).tag = "text"))

\* Variable initial values are inside their declared domain.
Check_VarInit ==
  \A v \in DOMAIN VarKind :
    (VarKind[v] = "number" => VarInit[v] \in Int)
    /\ (VarKind[v] = "string" => VarInit[v] \in VarTexts)
================================================================================
