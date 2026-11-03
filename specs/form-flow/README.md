# Form flow & logic — a TLA+ model

A machine-checked model of HeyForm's form pipeline: what a respondent can send,
which question the form shows next, which variables the logic rules update, what
finally lands in the `answers` array of a submission — and what happens to those
answers when the builder later changes a field's kind.

```
            Answer(fid, v)                        Leave                     Submit
 respondent ───────────────▶ values ───────────────────────────▶ visited ─────────────────▶ archive
 (any JSON)                   │            calculate rules,          │      server replay:        │
                              │            first matching jump      │      Replay(kind, values), │
                              ▼                                    ▼      validate + normalise    ▼
                        condition evaluation                cursor moves     fieldValuesToAnswers  answers
                                                                                                  │
                                     builder: ChangeFieldKind(fid, k) ────────────────────────────┘
                                     (history keeps its own kind; the table must not crash)
```

Three questions the model answers:

1. **Can any answer shape reach storage that the submissions table cannot
   handle?** (`Answer_TypeSafe`, `Answer_KindMatchesField`, `Answer_ChoiceSound`)
2. **Is the flow itself sound?** jumps only forward, targets exist, every
   branch answer has a destination, no dead rule, variables keep their type,
   the walk always terminates, and the client's walk equals the server's replay.
   (`Config_*`, `Flow_*`, `Var_*`, `Client_MatchesServer`, `Termination`)
3. **What happens after a field's kind changes?** (`Drift_*`, and the `Config_*`
   checks re-evaluated against the edited form)

## 摘要

- 模型覆盖 `packages/answer-utils/src` 的 `validate` / `validateCondition` /
  `calculateAction` / `createFieldNavigation` / `applyLogicToFields` /
  `fieldValuesToAnswers`，`complete-submission.resolver.ts` 的提交流程，以及
  builder 的 `TypeSwitcher`（改字段类型）。
- 关键做法：把「值」建模成带 `tag` 的定长记录（`text`/`num`/`bool`/`single`/
  `multi`/`pair`/`obj`/`rows`），环境可以提交**任意**形状的值；`kind` 是**变量**，
  `ChangeFieldKind` 可以在任何时刻（含已产生历史提交之后）改字段类型。TLC 穷举的
  是「恶意输入 × 任意改类型」的组合，而不是只测合法输入。
- 结论：**提交与渲染在穷举范围内没有崩溃路径**；改类型之后，表格仍然安全，因为它
  按「字段当前类型」分发、并用 `answer.kind !== field.kind` 挡住历史答案 ——
  `MCDrift` 通过，去掉这道守卫的 `MCDriftUnguarded` 立刻失败（证明守卫是必要的）。
- 四个已确认的问题：① 选填字段留空存成 `""`；② `rating` 的 `parseInt` 让 `"3abc"`
  通过；③ 改类型后残留的 logic 规则变成死规则（jump 静默失效，或被重新解释）；
  ④ 改类型后 calculate 的引用不再是数字（变量静默停止更新）。
- PR #387（ending 可「不保存回复」）单独建模在 `Discard.tla`：渲染端与服务端各自用
  `resolveEnding()` 判断，两边看到的是**不同的字段投影**（客户端在未接 Stripe 时丢掉
  payment 字段；服务端丢掉空 group）。穷举所有答案 × 两条提交路径 × 两种支付配置
  （131,072 状态）证明「服务端绝不会丢弃渲染端已保存的回复」；同时用反例证明空 group
  过滤是必需的（去掉即丢数据），并找出 3 个 PR 问题（IP 限额被消耗、嵌套 ending
  无法显示、倒计时路径显示通用结束页）。详见「PR #387」一节。

## Files

| File | Contents |
| --- | --- |
| `FormDomain.tla` | Stateless model: value shapes, per-kind domains, `validate()`, `validateCondition()`, `calculateAction()`, `createFieldNavigation()`, the server replay, and the `Check_*(kinds)` form checks. |
| `FormFlow.tla` | State machine (`Answer` / `Leave` / `ChangeFieldKind` / `Submit`), the safety invariants and the liveness property. |
| `Discard.tla` | PR #387: `resolveEnding()` and `isSubmissionDiscarded()` for both projections of the form, and the screen the respondent is shown. |
| `MCDiscard.tla` | The forms used by the `MCDiscard*` configs. |
| `MCModel.tla` | The concrete forms under test: `FlowForm`, `AttackForm`, `SmallForm`, `DriftForm` (+ `DriftLogicForm`, `DriftCalcForm`), `BrokenForm`. |
| `*.cfg` | One TLC run per concern, see [Results](#results). |
| `run.sh` | Runs every config and asserts the expected verdict. |

## The `Form` record

The whole form is a single constant, so testing another form means writing one
record (see `MCModel.tla`) and one `.cfg`:

| Field | Meaning |
| --- | --- |
| `ids` | set of field ids |
| `order` | sequence of field ids in display order (last one is the thank-you) |
| `kind` | `FieldId -> FieldKindEnum` — the published kind map (a *variable* in the spec) |
| `required` | `FieldId -> BOOLEAN` |
| `next` | `FieldId -> FieldId \/ "none"` (the unconditional `nextFieldId`) |
| `choices` | `FieldId -> {choiceId}` |
| `allowOther`, `allowMultiple`, `allowBlankOther` | `FieldId -> BOOLEAN` |
| `total` | `FieldId -> Nat` (rating / opinion scale total) |
| `logics` | `FieldId -> Seq(payload)`, payloads built with `Nav`/`Calc`/`Ref`/`Const` |
| `branchByAnswer` | `FieldId -> BOOLEAN` |
| `mutableFields` | field ids whose kind the builder may change (`{}` = freeze the form) |
| `mutableKinds` | kinds such a field may be switched to |
| `varKind`, `varInit`, `varTexts` | variables: id -> `"number"`/`"string"`, initial value, string domain |
| `textVals`, `numVals`, `dateSeq`, `choiceSets`, `otherTexts`, `objShapes`, `rowShapes`, `choiceIds`, `otherChoice` | the finite value universe |
| `envMode` | `"honest"` (only the field on screen) or `"hostile"` (any field, any time) |
| `sentAll`, `attackVals` | what the environment may submit (`sentAll` = the whole universe) |

## What each invariant checks, and where it comes from

| Invariant | Property | Mirrors |
| --- | --- | --- |
| `Config_OrderSound` | order is a permutation of `ids` and ends on a thank-you | `flattenFields` |
| `Config_NextTargets` | every `nextFieldId` and every jump target exists and moves forward | `createFieldNavigation.isValidDestination` |
| `Config_BranchCoverage` | while a branching question is still a choice kind, every option (and "Other") has a destination, and it is required and single-answer | `getChoiceBranchingErrors` |
| `Config_RulesReachable` | every jump/calculate rule can fire for some answer under the field's **current** kind (no dead rule) | `validateCondition` per kind |
| `Config_CalcTyped` | calculate writes a number variable from numeric operands (and string from text) under the **current** kinds | `calculateAction` |
| `Config_VarInit` | initial variable values are in their domain | `applyLogicToFields` |
| `Flow_ForwardOnly` | the visited sequence is strictly increasing | `applyLogicToFields` (`jumpIndex > index`) |
| `Flow_NoTerminalVisit` | a thank-you screen is never answered or stored | the `break` on `THANK_YOU` |
| `Answer_NoStatementAnswers` | only question kinds produce answers | `fieldsToValidateRules` |
| `Answer_KindMatchesField` | `answer.kind` equals the field's current kind (only while the form is not edited) | `fieldValuesToAnswers` |
| `Answer_TypeSafe` | every stored value has a shape **its own kind** can produce, so no renderer dereferences a missing shape | `validate` + `fieldValuesToAnswers` |
| `Answer_StrictlyTyped` | every stored value is in its kind's domain (no coercion, no `""`) | ditto, strict version |
| `Answer_FollowsWalk` | answers are exactly the visited questions, in order, once | `selectSubmissionFields` |
| `Answer_IdsUnique` | no duplicate answers | `fieldValuesToAnswers` |
| `Answer_RequiredAnswered` | required visited questions are non-empty | `validate` |
| `Answer_ChoiceSound` | selections ⊆ declared options, "Other" only when allowed, single-answer when not multiple | `validateMultipleChoice` |
| `Var_Typed`, `Var_ArchivedTyped` | a variable never changes type, including after division by zero | `calculateNumber` / `calculateString` |
| `Client_MatchesServer` | the client's walk equals the server's replay of the same answers (unless the form was edited mid-run) | `applyLogicToFields` vs. client store |
| `Drift_StoredKindSnapshot` | each answer keeps the kind it was validated with; a later edit never rewrites it | `fieldValuesToAnswers` (stores `kind` + `properties`) |
| `Drift_RenderSafe` | whenever `SubmissionCell` reads a value (i.e. `answer.kind = field.kind`), the value has that kind's shape | `answer.kind !== field.kind` guard |
| `Drift_UnguardedWouldCrash` | what would be needed if that guard were removed — expected to fail after an edit | ditto, guard dropped |
| `Termination` | every fair run reaches the end of the form | `getNextIndex` monotonicity |
| `NoDataLoss` | a discarded submission is one the renderer would have discarded too | `resolveEnding` on both projections |
| `DiscardedIsValidated` | answers are validated before the discard return | `completeSubmission` order |
| `ShownIsResolved` | the screen the respondent sees is the ending the decision used | `setIsSubmitted` + `Blocks.tsx` |
| `ShownSavingWhenSaved` | a stored response never ends on a discarding screen | `Blocks.tsx` fallback |

## Results

`./run.sh` (TLC 2.19, 4 workers except `MCTerm`), distinct states explored:

| Config | Form / client | Verdict | States |
| --- | --- | --- | --- |
| `MCFlow` | `FlowForm`, honest | **pass** — all safety + config invariants | 348,536 |
| `MCAttack` | `AttackForm`, hostile | **pass** — no bad stored shape | 941,192 |
| `MCTerm` | `SmallForm`, honest | **pass** — `Termination` | 514 |
| `MCDrift` | `DriftForm`, honest, kinds editable | **pass** — drift cannot break the table | 42,472 |
| `MCStrict` | `AttackForm`, hostile | **fail** — finding 1 | 369,813 |
| `MCTypeHole` | `AttackForm`, hostile | **fail** — finding 2 | 479,479 |
| `MCDriftLogic` | `DriftLogicForm` | **fail** — finding 3 | 19 |
| `MCDriftCalc` | `DriftCalcForm` | **fail** — finding 4 | 15 |
| `MCDriftUnguarded` | `DriftForm` | **fail** — the guard is load-bearing | 4,155 |
| `MCBroken` | broken jump target | **fail** — `Config_NextTargets` | — |
| `MCBrokenRule` | dead `contains` rule on a yes/no field | **fail** — `Config_RulesReachable` | — |
| `MCDiscard` | PR #387 form, all answers | **pass** — no data loss | 131,072 |
| `MCDiscardVar` | PR #387 form with variable rules | **pass** — server keeps | 131,072 |
| `MCDiscardGroup` | empty group on the route | **pass** — filter keeps both sides in step | 1,944 |
| `MCDiscardGroupBroken` | same, filter removed | **fail** — server discards a saved response | 1,944 |
| `MCDiscardShown` | nested ending | **fail** — resolved ending is not shown | — |
| `MCDiscardCountdown` | time limit | **fail** — saved route shows the generic screen | — |

`FlowForm` covers: a welcome screen, a text jump, a `yes_no` question branching by
answer, an optional number with a `total += q4` calculate rule and a numeric
jump, a multiple-choice question with "Other" and a `contains` jump, a rating,
and a thank-you. `AttackForm` covers every kind whose stored value the
submissions table inspects. `DriftForm` is a three-question form whose kinds can
be switched between `short_text`, `number` and `yes_no` at any time.

## Findings

### 1. An unanswered optional field is stored as `""`, not as its kind's shape

`fieldValuesToAnswers` replaces an empty answer with `''` (or `{value: []}` for
choice kinds) regardless of the field kind
(`packages/answer-utils/src/field-values-to-answer.ts`):

```ts
if (helper.isEmpty(value)) {
  value = CHOICES_FIELD_KINDS.includes(rule.kind) ? { value: [] } : ''
}
```

So a submission can contain `{kind: 'number', value: ''}`,
`{kind: 'date_range', value: ''}`, `{kind: 'full_name', value: ''}` or
`{kind: 'input_table', value: ''}`. `MCStrict` produces exactly this
counterexample (every optional field left blank, submission accepted).

`SubmissionCell` guards each of those shapes (`isObject`, `isValidArray`,
`isNumeric`), so **the table does not crash** — that is why `Answer_TypeSafe`
still holds. But anything that does arithmetic or `.map()` on the value without
a guard (CSV export, analytics, integrations) has to repeat the guard.

Fix: normalise to the kind's empty value (`null` for object/number kinds,
`[]` for tables) or make the empty value explicit in `AnswerValue`.

### 2. `rating` accepts `"3abc"` because `validateInt` uses `parseInt`

`validateRating` → `validateInt(value, 1, total)` → `parseInt(value)`, which
accepts any string with a leading digit:

```ts
function validateInt(value: any, min?: number, max?: number): boolean {
  const int = parseInt(value)
  return (max ? int <= max : true) && (helper.isNil(min) || int >= min!)
}
```

`"3abc"` passes for a 1..5 rating and is stored verbatim, with `kind: 'rating'`.
`MCTypeHole` produces this counterexample. `OpinionScaleItem` renders a rating
only when `helper.isNumeric(value)` holds, so the cell is blank rather than
crashing — but the stored data is wrong and any export will carry it.

Fix: `Number.isInteger(Number(value))` (or coerce after validating) in
`validateInt`/`validateNumber`.

Both findings are also reachable for `number` fields answered with numeric text
(`isNumeric(String(value))`): the model allows it on purpose (`TypeSafe`
includes numeric text) because `validateNumber` documents that coercion.

### 3. Changing a field's kind leaves its logic rules behind

`TypeSwitcher` dispatches `updateField` with only `{ kind, properties }`
(`Builder/RightSidebar/Question/TypeSwitcher.tsx`); `getPropertiesFromKind`
merges defaults for the *new* kind and keeps the old `choices`/`total`, and the
form's `logics` are not touched at all. `getChoiceBranchingErrors` only reports
problems while the field is still a branching choice question, so the switch is
silent. Two consequences, both reachable in `MCDriftLogic`:

- **Dead jump.** `short_text` → `number` keeps `is "skip"`: `validateCondition`
  for a number field only understands `equal`/`not_equal`/`greater_than`/…, so
  the rule can never fire and the branch silently disappears.
- **Re-interpreted jump.** `yes_no` → `short_text` keeps `is <choiceId>`: for a
  text field the comparison is string equality, so the rule now fires when the
  respondent types the literal choice id (`"y"`), which is almost certainly not
  what the author meant.

Fix: on a type switch, drop (or flag) rules whose comparison is not valid for
the new kind — the same way `removeInvalidNextFieldIds` prunes stale jumps.

### 4. Changing a field's kind can silently stop a calculate rule

`MCFlow`'s `total += q4` reads `values[q4]` and only applies it when
`isNumber(newValue)`. If `q4` becomes `short_text`, the operand is a string, so
the variable keeps its old value and nothing reports it. `MCDriftCalc` shows the
counterexample; `Config_CalcTyped` is the check that catches it statically.

### Schema drift: why the submissions table still does not crash

This is the case the model was extended for, and the result is a *proof by
exhaustive search* (`MCDrift`, 42,472 states, every reachable combination of
answers and kind changes):

- **History keeps its own kind.** `fieldValuesToAnswers` stores
  `{ id, title, kind, properties, value }` — a snapshot. An edit never rewrites
  `answers`, so `Drift_StoredKindSnapshot` holds and
  `Answer_TypeSafe` (checked against `answer.kind`, not the field's kind) holds
  too.
- **The table dispatches on the field's current kind and guards the value.**
  Every cell starts with `answer.kind !== field.kind` → `return null`, so a
  drifted answer renders as an empty cell. `Drift_RenderSafe` says exactly this:
  whenever the cell *does* read the value, the value has that kind's shape.
- **The guard is not redundant.** `MCDriftUnguarded` removes it and fails
  immediately: submit `d3 = 3` (number), switch `d3` to `short_text`, and the
  text renderer would be handed a number.
- **Exports are already drift-safe**, by a different mechanism: `answerToText`,
  `answersToPlain` and `answersToJson` dispatch on `answer.kind` and read
  `answer.properties`, both snapshots — and `answerToText` wraps the conversion
  in `try/catch` with the comment *"Historical submissions may predate current
  validation"*. Google Sheets builds cells the same way, and even appends
  columns for questions that no longer exist.
- **The UI shows a blank cell, not a crash.** That is a data-visibility issue:
  after an edit, historical answers to that question disappear from the table
  until the kind is switched back (the guard compares kinds, not compatibility).

Two related hazards the model also pins down:

- `Answer_KindMatchesField` (answer kind = field kind) is deliberately **not** an
  invariant once the form is editable — it is the property that drift breaks, and
  the table is designed for it. It is checked in `MCFlow`/`MCAttack`, where
  `mutableFields = {}`.
- `Client_MatchesServer` is conditioned on `stable` (no edit during the run):
  editing a field's kind while someone is filling the form makes the server
  replay a different walk than the client showed. For partial submissions the
  server even rejects it (`Invalid partial submission`).

## PR #387 — endings that keep responses out of the form

Closes #365 ("block a submission from a logic jump"). An ending
(`thank_you`) gets `properties.discardSubmission`; when the answers lead to
such an ending, nothing is stored, nothing is queued and nothing is charged.

### How it is modelled

`Discard.tla` mirrors the three places that decide:

| Spec | Code |
| --- | --- |
| `EndingFor(order, values, partial)` | `resolveEnding()` — walk `[...questions, ...endings]` with `applyLogicToFields`, slice a partial submission with `sliceFieldsByLogics`, then ask the last field's logic / `nextFieldId` / fall back to the first ending |
| `TouchedOf` / `SliceFrom` | the `isTouched` mutation in `applyLogicToFields` and `sliceFieldsByLogics` |
| `ClientDiscard` | `Form.tsx` / `Header.tsx`: `resolveEnding([...allFields, ...thankYouFields], …)` |
| `ServerDiscard` | `isSubmissionDiscarded()`: a discarding ending must exist, no variable may carry logic, and *both* the full projection and the one without payment fields must end there |
| `ShownEnding(path, …)` | `setIsSubmitted({thankYouFieldId})` + `Blocks.tsx` looking the id up in `state.thankYouFields` |

The two sides see different fields — that is the whole risk. `ClientSees`
drops welcome screens and (when Stripe is off) payment fields; `ServerSees`
keeps every form field but drops empty groups. `MCDiscard` enumerates **all**
answer maps (4 values over 7 fields), both submission paths and both payment
setups: 131,072 states, no data loss.

### Results

- `MCDiscard` / `MCDiscardVar` / `MCDiscardGroup` **pass**: the server never
  discards a response the renderer would have saved, over every answer map.
  With variable rules the server keeps everything, so it cannot lose anything.
- `MCDiscardGroupBroken` **fails**: delete the empty-group filter from
  `isSubmissionDiscarded` and the server follows a group the renderer dropped,
  reaches the discarding ending and throws away a response the respondent saw
  as saved. The filter is load-bearing, not defensive.
- `MCDiscardShown` / `MCDiscardCountdown` **fail**: see the review below.

### Review of the PR

Checked against the code on `pr-387` (`ac07545`) and by running
`resolveEnding` / `isSubmissionDiscarded` over generated forms and answers.

| # | Severity | Finding |
| --- | --- | --- |
| 1 | **bug** | A discarded submission still consumes the form's **IP limit**: `submissionIpLimitService.checkIp()` runs (and increments the counter) before the discard check in `completeSubmission`. On a form with `enableIpLimit` and a screening ending, screened-out visitors use up the allowance, and the next visitor on that IP gets "new submissions are no longer accepted" without a single stored response. The quota limit (`createWithinQuota`) is correctly skipped. |
| 2 | **bug** | An ending **nested in a group** is resolved by `resolveEnding` (both sides agree, so nothing is mis-saved) but cannot be displayed: `state.thankYouFields` only holds top-level endings, so `Blocks.tsx` falls back to the generic "Thanks for completing this form" screen. For a *discarding* nested ending the respondent is told they completed a form that was not saved. `Form.tsx` did not do this before the PR — it could only resolve top-level endings — so this is a regression for that form shape. Reachable by dragging a Thank You into a group (the nested `ReactSortable` accepts `put: ['root', 'nested']`, and `updateNestFields` does not filter kinds); the Add menu prevents it. |
| 3 | **bug (minor)** | On the **time-limit path** `Header.tsx` passes `thankYouFieldId` only when it discards, so a submission that *is* saved shows the generic screen instead of the ending its route reaches — the resolved `ending` is thrown away one line after being computed. Pre-existing, but the PR has the value in hand and its new `countdown-submission.test.tsx` asserts `data-ending === 'none'`, locking the wrong behaviour in. |
| 4 | nit | `isSubmissionDiscarded` calls `resolveEnding` twice and `resolveEnding` walks + clones the field list twice, so every submission on a form with a discarding ending costs 4 `applyLogicToFields` walks and 4 clones of every field. Forms without such an ending are unaffected (early return). |
| 5 | nit | `getNavigateFieldId` re-implements destination checking as "is the target a thank-you field", without `createFieldNavigation`'s forward-only / jumpable-source rules. A stale `nextFieldId` on a group or pointing backwards would be honoured here and ignored by the real navigation. Unreachable in practice (`removeInvalidNextFieldIds` prunes those on save) and harmless while both sides call `resolveEnding`, but it is a second definition of the same rule. |
| 6 | note | The date fix (`isSameDate`/`isBeforeDate`/`isAfterDate` return false for a nil value instead of dayjs reading "now") changes routing for **every** form, not just this feature: a rule like "is before today" on an unanswered date stops firing. Correct, but it deserves a changelog line. |
| 7 | note | The two conservative divergences are deliberate and documented in the PR body: forms with variable rules, and routes where payment fields change the ending, are kept by the server even if a stale tab posts them. The model confirms they can only *keep* a response, never drop one (`MCDiscardVar`). |

Verified as sound (and now machine-checked): the server's decision is a subset
of the renderer's over all answers (`MCDiscard`), discarded submissions are
validated first (`DiscardedIsValidated`), required questions on the route are
checked before the ending is resolved, and the embed stays open.

## Out of scope / extension points

- **Property drift, not just kind drift.** Switching a kind also leaves the old
  `choices`, `total` and `tableColumns` in place. Model an action
  `ChangeProperties(fid, choices, total)` and check that stored choice answers
  stay a subset of the *current* options, and that `InputTableItem` cells
  resolve against the current columns.
- **Partial submissions.** `selectSubmissionFields` cuts the field list at the
  first navigate field whose last rule did not fire (`isTouched`). Modelling it
  needs the `isTouched` mutation in `applyLogicToFields`; the shape is
  `PartialCutSound`: the cut keeps at least one field and all required fields
  before it are answered.
- **Group fields.** `flattenFields(fields, true)` keeps the group itself in the
  walk; the model treats `group` like a statement (never answered), which is
  what `fieldsToValidateRules` does.
- **Payments.** The resolver overwrites the answer with
  `resolvePaymentConfiguration(...)`, so a respondent cannot choose the amount.
  The model only checks the stored shape (`Obj("complete")`); the amount
  invariant would be `paymentAnswer.value.amount = round(price * 100)`.
- **Time.** There is no clock in the model: form expiration, time limits and
  `submit_date` are orthogonal to flow and typing.

## Running

```bash
cd specs/form-flow
./run.sh              # downloads tla2tools.jar into .tools/ on first run
WORKERS=1 ./run.sh    # fewer workers
```

A single config:

```bash
java -XX:+UseParallelGC -cp .tools/tla2tools.jar \
  tlc2.TLC -config MCFlow.cfg -workers 4 MCModel.tla
```

TLC 2.19 is required (`v1.8.0` of tla2tools). `MCTerm` must stay
single-worker: TLC's liveness tableau is memory-hungry with parallel workers.
