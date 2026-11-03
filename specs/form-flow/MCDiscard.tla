------------------------------- MODULE MCDiscard -------------------------------
\* Forms for the PR #387 model (Discard.tla).
\* -------------------------------------------------------------------------------

EXTENDS Discard

\* ---------------------------------------------------------------------------
\* q1 --jump--> later (discarding)      pay: payment field
\* q2 --jump--> nested                  ok: saving ending, later: discarding
\* nested: a discarding ending inside a group (the renderer cannot show it)
\* ---------------------------------------------------------------------------
DiscardForm ==
  [ ids |-> {"q1", "pay", "q2", "ok", "later", "g", "nested"},
    order |-> <<"q1", "pay", "q2", "ok", "later", "g", "nested">>,
    kind |-> [q1 |-> "short_text", pay |-> "payment", q2 |-> "short_text",
              ok |-> "thank_you", later |-> "thank_you", g |-> "group",
              nested |-> "thank_you"],
    required |-> [q1 |-> TRUE, pay |-> FALSE, q2 |-> FALSE, ok |-> FALSE,
                  later |-> FALSE, g |-> FALSE, nested |-> FALSE],
    next |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> "none"],
    choices |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> {}],
    allowOther |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> FALSE],
    allowMultiple |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> FALSE],
    allowBlankOther |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> FALSE],
    total |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> 0],
    logics |->
      [ q1 |-> <<Nav("is", Text("no"), "later")>>,
        pay |-> <<>>,
        q2 |-> <<Nav("is", Text("x"), "nested")>>,
        ok |-> <<>>,
        later |-> <<>>,
        g |-> <<>>,
        nested |-> <<>> ],
    branchByAnswer |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> FALSE],
    mutableFields |-> {},
    mutableKinds |-> {},
    varKind |-> [total |-> "number"],
    varInit |-> [total |-> 0],
    varTexts |-> {"", "no", "x"},
    textVals |-> {"", "no", "x"},
    numVals |-> {0},
    dateSeq |-> <<"2024-01-01">>,
    choiceSets |-> {{}},
    otherTexts |-> {""},
    objShapes |-> {"complete", "empty"},
    rowShapes |-> {"full", "empty"},
    choiceIds |-> {},
    otherChoice |-> "__other__",
    envMode |-> "honest",
    sentAll |-> FALSE,
    attackVals |-> {Nil, Text(""), Text("no"), Text("x")},
    discardEnding |-> [q1 |-> FALSE, pay |-> FALSE, q2 |-> FALSE, ok |-> FALSE,
                       later |-> TRUE, g |-> FALSE, nested |-> TRUE],
    topLevel |-> [q1 |-> TRUE, pay |-> TRUE, q2 |-> TRUE, ok |-> TRUE,
                  later |-> TRUE, g |-> TRUE, nested |-> FALSE],
    emptyGroup |-> [f \in {"q1", "pay", "q2", "ok", "later", "g", "nested"} |-> FALSE],
    varHasRules |-> FALSE,
    serverDropsEmptyGroups |-> TRUE ]

\* Same form, but a variable carries logic: the server leaves the decision to the
\* renderer and keeps every response.
DiscardVarForm == [DiscardForm EXCEPT !.varHasRules = TRUE]

\* An empty group on the route: q1 points at it, q2 points at the saving ending.
\* With the server's empty-group filter the two sides agree; without it the
\* server follows the group and discards a response the renderer saved.
DiscardGroupForm ==
  [ ids |-> {"q1", "q2", "empty", "ok", "later"},
    order |-> <<"q1", "q2", "empty", "later", "ok">>,
    kind |-> [q1 |-> "short_text", q2 |-> "short_text", empty |-> "group",
              ok |-> "thank_you", later |-> "thank_you"],
    required |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> FALSE],
    next |-> [q1 |-> "empty", q2 |-> "ok", empty |-> "none", ok |-> "none",
              later |-> "none"],
    choices |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> {}],
    allowOther |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> FALSE],
    allowMultiple |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> FALSE],
    allowBlankOther |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> FALSE],
    total |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> 0],
    logics |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> <<>>],
    branchByAnswer |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> FALSE],
    mutableFields |-> {},
    mutableKinds |-> {},
    varKind |-> [total |-> "number"],
    varInit |-> [total |-> 0],
    varTexts |-> {"", "no", "x"},
    textVals |-> {"", "no", "x"},
    numVals |-> {0},
    dateSeq |-> <<"2024-01-01">>,
    choiceSets |-> {{}},
    otherTexts |-> {""},
    objShapes |-> {"complete", "empty"},
    rowShapes |-> {"full", "empty"},
    choiceIds |-> {},
    otherChoice |-> "__other__",
    envMode |-> "honest",
    sentAll |-> FALSE,
    attackVals |-> {Nil, Text(""), Text("no")},
    discardEnding |-> [q1 |-> FALSE, q2 |-> FALSE, empty |-> FALSE, ok |-> FALSE,
                       later |-> TRUE],
    topLevel |-> [f \in {"q1", "q2", "empty", "ok", "later"} |-> TRUE],
    emptyGroup |-> [q1 |-> FALSE, q2 |-> FALSE, empty |-> TRUE, ok |-> FALSE,
                    later |-> FALSE],
    varHasRules |-> FALSE,
    serverDropsEmptyGroups |-> TRUE ]

\* The same form without the server's empty-group filter.
DiscardGroupUnfilteredForm == [DiscardGroupForm EXCEPT !.serverDropsEmptyGroups = FALSE]
================================================================================
