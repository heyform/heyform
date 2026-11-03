------------------------------- MODULE MCModel -------------------------------
\* Concrete forms used by the TLA+ configurations in this directory.
\*
\* FlowForm    - a healthy form that exercises every flow/logic feature.
\* AttackForm  - every kind whose stored shape the submissions table
\*               dereferences, answered by a hostile client.
\* BrokenForm  - FlowForm with a jump to a field that does not exist and a rule
\*               that can never fire (Config_* invariants must fail).
\* -------------------------------------------------------------------------------

EXTENDS FormFlow

\* ---------------------------------------------------------------------------
\* A healthy form:
\*
\*   w1 welcome
\*   q2 short_text   (required)  jump to q5 when the answer is "skip"
\*   q3 yes_no       (required, branching by answer: y -> q5, n -> q4)
\*   q4 number       (optional)  total += q4, jump to q6 when q4 > 5
\*   q5 multiple_choice (required, multiple, other) jump to q6 when c2 is chosen
\*   q6 rating       (required, 1..5)
\*   t7 thank_you
\* ---------------------------------------------------------------------------
FlowForm ==
  [ ids |-> {"w1", "q2", "q3", "q4", "q5", "q6", "t7"},
    order |-> <<"w1", "q2", "q3", "q4", "q5", "q6", "t7">>,
    kind |-> [w1 |-> "welcome",
              q2 |-> "short_text",
              q3 |-> "yes_no",
              q4 |-> "number",
              q5 |-> "multiple_choice",
              q6 |-> "rating",
              t7 |-> "thank_you"],
    required |-> [w1 |-> FALSE, q2 |-> TRUE, q3 |-> TRUE, q4 |-> FALSE,
                  q5 |-> TRUE, q6 |-> TRUE, t7 |-> FALSE],
    next |-> [f \in {"w1", "q2", "q3", "q4", "q5", "q6", "t7"} |->
                IF f = "q4" THEN "q5" ELSE "none"],
    choices |-> [w1 |-> {}, q2 |-> {}, q3 |-> {"y", "n"}, q4 |-> {},
                 q5 |-> {"c1", "c2"}, q6 |-> {}, t7 |-> {}],
    allowOther |-> [f \in {"w1", "q2", "q3", "q4", "q5", "q6", "t7"} |->
                     f = "q5"],
    allowMultiple |-> [f \in {"w1", "q2", "q3", "q4", "q5", "q6", "t7"} |->
                        f = "q5"],
    allowBlankOther |-> [f \in {"w1", "q2", "q3", "q4", "q5", "q6", "t7"} |->
                          f = "q5"],
    total |-> [w1 |-> 0, q2 |-> 0, q3 |-> 0, q4 |-> 0, q5 |-> 0, q6 |-> 5,
               t7 |-> 0],
    logics |->
      [ w1 |-> <<>>,
        q2 |-> <<Nav("is", Text("skip"), "q5")>>,
        q3 |-> <<Nav("is", Single("y"), "q5"),
                 Nav("is", Single("n"), "q4")>>,
        q4 |-> <<CalcV("greater_or_equal_than", Num(0), "total", "add", Ref("q4")),
                 Nav("greater_than", Num(5), "q6")>>,
        q5 |-> <<Nav("contains", SelSet({"c2"}), "q6")>>,
        q6 |-> <<>>,
        t7 |-> <<>> ],
    branchByAnswer |-> [f \in {"w1", "q2", "q3", "q4", "q5", "q6", "t7"} |->
                         f = "q3"],
    mutableFields |-> {},
    mutableKinds |-> {},
    varKind |-> [total |-> "number"],
    varInit |-> [total |-> 0],
    varTexts |-> {"", "a", "skip", "12"},
    textVals |-> {"", "a", "skip", "12"},
    numVals |-> {0, 1, 3, 5, 7},
    dateSeq |-> <<"2024-01-01", "2024-02-01">>,
    choiceSets |-> {{}, {"c1"}, {"c2"}, {"c1", "c2"}, {"zz"}},
    otherTexts |-> {"", "x"},
    objShapes |-> {"complete", "partial", "empty"},
    rowShapes |-> {"full", "empty", "ragged"},
    choiceIds |-> {"y", "n", "c1", "c2"},
    otherChoice |-> "__other__",
    envMode |-> "honest",
    sentAll |-> FALSE,
    attackVals |->
      {Nil, Text(""), Text("a"), Text("skip"), Text("12"), Num(3), Num(7),
       Single("y"), Single("n"), Multi({"c1", "c2"}, "x"), Multi({"c1"}, "")} ]

\* ---------------------------------------------------------------------------
\* Every kind whose stored value the submissions table inspects, all optional so
\* a hostile client can leave them blank, plus a rating to reach parseInt().
\* ---------------------------------------------------------------------------
AttackForm ==
  [ ids |-> {"a1", "a2", "a3", "a4", "a5", "a6", "t7"},
    order |-> <<"a1", "a2", "a3", "a4", "a5", "a6", "t7">>,
    kind |-> [a1 |-> "short_text",
              a2 |-> "number",
              a3 |-> "rating",
              a4 |-> "date_range",
              a5 |-> "full_name",
              a6 |-> "input_table",
              t7 |-> "thank_you"],
    required |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> FALSE],
    next |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> "none"],
    choices |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> {}],
    allowOther |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> FALSE],
    allowMultiple |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> FALSE],
    allowBlankOther |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> FALSE],
    total |-> [a1 |-> 0, a2 |-> 0, a3 |-> 5, a4 |-> 0, a5 |-> 0, a6 |-> 0,
               t7 |-> 0],
    logics |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> <<>>],
    branchByAnswer |-> [f \in {"a1", "a2", "a3", "a4", "a5", "a6", "t7"} |-> FALSE],
    mutableFields |-> {},
    mutableKinds |-> {},
    varKind |-> [total |-> "number"],
    varInit |-> [total |-> 0],
    varTexts |-> {"", "a", "12"},
    textVals |-> {"", "a", "12", "3abc"},
    numVals |-> {0, 1, 5},
    dateSeq |-> <<"2024-01-01", "2024-02-01">>,
    choiceSets |-> {{}},
    otherTexts |-> {""},
    objShapes |-> {"complete", "empty"},
    rowShapes |-> {"full", "empty", "ragged"},
    choiceIds |-> {},
    otherChoice |-> "__other__",
    envMode |-> "hostile",
    sentAll |-> FALSE,
    attackVals |->
      {Nil, Text(""), Text("12"), Text("3abc"), Num(7), Obj("empty"),
       Rows("ragged")} ]

\* ---------------------------------------------------------------------------
\* A tiny form used for the liveness check (a branch straight to the thank-you
\* screen, so the jump target is a terminal screen).
\*
\*   s1 short_text (required) jump to s3 when the answer is "skip"
\*   s2 yes_no     (required, branching by answer: y -> t4, n -> s3)
\*   s3 number     (optional)
\*   t4 thank_you
\* ---------------------------------------------------------------------------
SmallForm ==
  [ ids |-> {"s1", "s2", "s3", "t4"},
    order |-> <<"s1", "s2", "s3", "t4">>,
    kind |-> [s1 |-> "short_text", s2 |-> "yes_no", s3 |-> "number",
              t4 |-> "thank_you"],
    required |-> [s1 |-> TRUE, s2 |-> TRUE, s3 |-> FALSE, t4 |-> FALSE],
    next |-> [f \in {"s1", "s2", "s3", "t4"} |-> "none"],
    choices |-> [s1 |-> {}, s2 |-> {"y", "n"}, s3 |-> {}, t4 |-> {}],
    allowOther |-> [f \in {"s1", "s2", "s3", "t4"} |-> FALSE],
    allowMultiple |-> [f \in {"s1", "s2", "s3", "t4"} |-> FALSE],
    allowBlankOther |-> [f \in {"s1", "s2", "s3", "t4"} |-> FALSE],
    total |-> [s1 |-> 0, s2 |-> 0, s3 |-> 0, t4 |-> 0],
    logics |->
      [ s1 |-> <<Nav("is", Text("skip"), "s3")>>,
        s2 |-> <<Nav("is", Single("y"), "t4"),
                 Nav("is", Single("n"), "s3")>>,
        s3 |-> <<>>,
        t4 |-> <<>> ],
    branchByAnswer |-> [f \in {"s1", "s2", "s3", "t4"} |-> f = "s2"],
    mutableFields |-> {},
    mutableKinds |-> {},
    varKind |-> [total |-> "number"],
    varInit |-> [total |-> 0],
    varTexts |-> {"", "a", "skip"},
    textVals |-> {"", "a", "skip"},
    numVals |-> {0, 3},
    dateSeq |-> <<"2024-01-01">>,
    choiceSets |-> {{}},
    otherTexts |-> {""},
    objShapes |-> {"complete", "empty"},
    rowShapes |-> {"full", "empty"},
    choiceIds |-> {"y", "n"},
    otherChoice |-> "__other__",
    envMode |-> "honest",
    sentAll |-> FALSE,
    attackVals |-> {Nil, Text(""), Text("skip"), Single("y"), Single("n"), Num(3)} ]

\* ---------------------------------------------------------------------------
\* Schema drift: the builder may change the kind of d1, d2 and d3 after
\* submissions exist (TypeSwitcher only adds the new kind's default properties;
\* choices, totals and logic rules stay behind).
\*
\*   d1 short_text (required) jump to d3 when the answer is "skip"
\*   d2 yes_no     (required, branching by answer: y -> d3, n -> t4)
\*   d3 number     (required) total += d3, jump to t4 when d3 > 5
\*   t4 thank_you
\* ---------------------------------------------------------------------------
DriftForm ==
  [ ids |-> {"d1", "d2", "d3", "t4"},
    order |-> <<"d1", "d2", "d3", "t4">>,
    kind |-> [d1 |-> "short_text", d2 |-> "yes_no", d3 |-> "number",
              t4 |-> "thank_you"],
    required |-> [d1 |-> TRUE, d2 |-> TRUE, d3 |-> TRUE, t4 |-> FALSE],
    next |-> [f \in {"d1", "d2", "d3", "t4"} |-> "none"],
    choices |-> [d1 |-> {}, d2 |-> {"y", "n"}, d3 |-> {}, t4 |-> {}],
    allowOther |-> [f \in {"d1", "d2", "d3", "t4"} |-> FALSE],
    allowMultiple |-> [f \in {"d1", "d2", "d3", "t4"} |-> FALSE],
    allowBlankOther |-> [f \in {"d1", "d2", "d3", "t4"} |-> FALSE],
    total |-> [d1 |-> 0, d2 |-> 0, d3 |-> 0, t4 |-> 0],
    logics |->
      [ d1 |-> <<Nav("is", Text("skip"), "d3")>>,
        d2 |-> <<Nav("is", Single("y"), "d3"),
                 Nav("is", Single("n"), "t4")>>,
        d3 |-> <<CalcV("greater_or_equal_than", Num(0), "total", "add", Ref("d3")),
                 Nav("greater_than", Num(5), "t4")>>,
        t4 |-> <<>> ],
    branchByAnswer |-> [f \in {"d1", "d2", "d3", "t4"} |-> f = "d2"],
    mutableFields |-> {"d1", "d2", "d3"},
    mutableKinds |-> {"short_text", "number", "yes_no"},
    varKind |-> [total |-> "number"],
    varInit |-> [total |-> 0],
    varTexts |-> {"", "a", "skip", "y", "n"},
    \* "y"/"n" are in the text universe on purpose: a leftover "is <choice>"
    \* rule on a field switched to short_text still matches the typed text.
    textVals |-> {"", "a", "skip", "y", "n"},
    numVals |-> {0, 3, 7},
    dateSeq |-> <<"2024-01-01">>,
    choiceSets |-> {{}},
    otherTexts |-> {""},
    objShapes |-> {"complete", "empty"},
    rowShapes |-> {"full", "empty"},
    choiceIds |-> {"y", "n"},
    otherChoice |-> "__other__",
    envMode |-> "honest",
    sentAll |-> FALSE,
    attackVals |-> {Nil, Text(""), Text("skip"), Single("y"), Single("n"),
                    Num(3), Num(7)} ]

\* DriftForm with only the jump-carrying questions mutable: switching one of
\* them to a number leaves its "is <text/choice>" rules impossible to satisfy.
DriftLogicForm == [DriftForm EXCEPT !.mutableFields = {"d1", "d2"}]

\* DriftForm with only the calculate operand mutable: switching d3 to text
\* leaves "total += d3" with a non-numeric operand.
DriftCalcForm == [DriftForm EXCEPT !.mutableFields = {"d3"}]

\* ---------------------------------------------------------------------------
\* FlowForm with two configuration bugs:
\*   - q2 jumps to "q9", which is not a field
\*   - q3's rule compares a yes/no answer with "contains", which can never hold
\* ---------------------------------------------------------------------------
BrokenForm ==
  LET base == FlowForm IN
  [ base EXCEPT
      !.logics = [base.logics EXCEPT
                    !.q2 = <<Nav("is", Text("skip"), "q9")>>,
                    !.q3 = <<Nav("contains", Single("y"), "q5")>>] ]
================================================================================
