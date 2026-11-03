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
- 模型的局限：值的**内部**被抽象成 `complete`/`partial`/`empty` 这样的标签，看不到
  嵌套对象（例如 `other: {a: 1}`、表格单元格是对象）。这一类由
  `packages/webapp/test/submission-cell-fuzz.test.tsx` 的模糊测试覆盖：随机 JSON 经过
  真实的 `fieldValuesToAnswers`，再用 `SubmissionCell`（表格 + 详情）和导出函数渲染。
  它找到并已修复了 5 处崩溃（见「Fuzz test」一节）。
- 结论：改类型之后表格仍然安全，因为它按「字段当前类型」分发、并用
  `answer.kind !== field.kind` 挡住历史答案 —— `MCDrift` 通过，去掉这道守卫的
  `MCDriftUnguarded` 立刻失败（证明守卫是必要的）。
- 已确认的问题：① 选填字段留空存成 `""`（未改，表格有守卫）；② `rating` 的
  `parseInt` 让 `"3abc"` 通过（**已修复**，`MCTypeHole` 现在通过，`MCTypeHoleLegacy`
  复现旧行为）；③ 改类型后残留的 logic 规则变成死规则；④ 改类型后 calculate 的引用
  不再是数字（③④ 未改，需要 builder 侧的设计）。
- PR #387（ending 可「不保存回复」）建模在 `Discard.tla`，并已合并到本分支。穷举所有
  答案 × 两条提交路径 × 两种支付配置（98,304 状态）证明「服务端绝不会丢弃渲染端已保存
  的回复」，并新增反方向的 `EndingsAgree`：两端从同样的答案得到**同一个** ending。
  旧模型按文档顺序排列客户端字段，漏掉了一个真实 bug：渲染端把 group 里的 ending
  排在顶层 ending 前面，没有显式跳转的路线会回落到它（丢弃回复），而服务端回落到第一
  个顶层 ending（保存）。该 bug 与「嵌套 ending 无法显示」「倒计时显示通用结束页」
  「被丢弃的提交仍消耗 IP 限额」均**已修复**，每个都有 `*Legacy` 配置复现修复前的行为。
- 另一个早已存在的问题（非 #387 引入，未修改）：倒计时结束时以 partial 方式提交，而
  服务端只接受「停在未解决的跳转字段」的 partial 提交，所以没有跳转逻辑、或跳转问题都
  已作答的表单，超时提交会被拒绝（`MCCountdownRejected`）。

## Files

| File | Contents |
| --- | --- |
| `FormDomain.tla` | Stateless model: value shapes, per-kind domains, `validate()`, `validateCondition()`, `calculateAction()`, `createFieldNavigation()`, the server replay, and the `Check_*(kinds)` form checks. |
| `FormFlow.tla` | State machine (`Answer` / `Leave` / `ChangeFieldKind` / `Submit`), the safety invariants and the liveness property. |
| `Discard.tla` | PR #387: `resolveEnding()` and `isSubmissionDiscarded()` for both projections of the form, and the screen the respondent is shown. |
| `MCDiscard.tla` | The forms used by the `MCDiscard*` configs, including `DiscardLegacyForm` / `DiscardCountdownLegacyForm`, which reproduce the code as #387 shipped it. |
| `MCModel.tla` | The concrete forms under test: `FlowForm`, `AttackForm` (+ `AttackParseIntForm`, the rating check before the fix), `SmallForm`, `DriftForm` (+ `DriftLogicForm`, `DriftCalcForm`), `BrokenForm`. |
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
| `ratingParseIntOnly` | `TRUE` checks a rating with `parseInt()` alone, as before the fix |
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
| `EndingsAgree` | the renderer and the server resolve the same ending from the same answers (without variable rules) | `resolveEnding` on both projections |
| `ClientDiscardIsServerDiscard` | the renderer only drops a response the server would drop too | ditto |
| `CountdownIsAccepted` | a time-limit submission whose answers are valid is not rejected | `Header.tsx` + `selectSubmissionFields` |

## Results

`./run.sh` (TLC 2.19, 4 workers except `MCTerm`, about 8 minutes), distinct states
explored for the configs that pass. A failing config stops at its first
counterexample.

| Config | Form / client | Verdict | States |
| --- | --- | --- | --- |
| `MCFlow` | `FlowForm`, honest | **pass** — all safety + config invariants | 348,536 |
| `MCAttack` | `AttackForm`, hostile | **pass** — no bad stored shape (`Answer_TypeSafe`) | 941,192 |
| `MCTerm` | `SmallForm`, honest | **pass** — `Termination` | 514 |
| `MCDrift` | `DriftForm`, honest, kinds editable | **pass** — drift cannot break the table | 42,472 |
| `MCStrict` | `AttackForm`, hostile | **fail** — finding 1 (open) | — |
| `MCTypeHole` | `AttackForm`, hostile | **pass** — finding 2 fixed | 941,192 |
| `MCTypeHoleLegacy` | `AttackParseIntForm` | **fail** — `"3abc"` stored for a rating before the fix | — |
| `MCDriftLogic` | `DriftLogicForm` | **fail** — finding 3 (open) | — |
| `MCDriftCalc` | `DriftCalcForm` | **fail** — finding 4 (open) | — |
| `MCDriftUnguarded` | `DriftForm` | **fail** — the guard is load-bearing | — |
| `MCBroken` | broken jump target | **fail** — `Config_NextTargets` | — |
| `MCBrokenRule` | dead `contains` rule on a yes/no field | **fail** — `Config_RulesReachable` | — |
| `MCDiscard` | PR #387 form, all answers | **pass** — no data loss, both sides agree | 98,304 |
| `MCDiscardLegacy` | same, as #387 shipped | **fail** — the renderer falls back to a nested ending | — |
| `MCDiscardVar` | PR #387 form with variable rules | **pass** — server keeps | 98,304 |
| `MCDiscardGroup` | empty group on the route | **pass** — filter keeps both sides in step | 1,458 |
| `MCDiscardGroupBroken` | same, filter removed | **fail** — server discards a saved response | — |
| `MCDiscardShown` | PR #387 form, both paths | **pass** — the resolved ending is shown | 98,304 |
| `MCDiscardShownLegacy` | as #387 shipped | **fail** — a nested ending cannot be shown | — |
| `MCDiscardCountdown` | time limit | **pass** — the saved route shows its ending | 32,768 |
| `MCDiscardCountdownLegacy` | time limit, as #387 shipped | **fail** — generic screen | — |
| `MCCountdownRejected` | time limit | **fail** — pre-existing, open (see below) | — |

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

**Fixed.** `validateRating` now needs `helper.isNumeric(value)` and a whole number
before the range check, and `validateNumber` checks `helper.isNumeric(value)`
instead of `isNumeric(String(value))` (which let `[3]` through and stored an array).
`MCTypeHole` passes; `MCTypeHoleLegacy` keeps the old check and still fails on
exactly `a3 = "3abc"`.

The original `MCTypeHole` counterexample was in fact a model artifact: the
`number` domain was `NumVals = {0, 1, 5}` while the attacker could send `Num(7)`,
so `Answer_TypeSafe` failed on a number field before it ever reached the rating.
The domain now holds every number the environment can send, which is also why
`MCAttack` can now include `Answer_TypeSafe`.

Numeric text stays allowed for `number`, `rating` and `opinion_scale` (`TypeSafe`
includes it) because `validateNumber` documents that coercion.

### Fuzz test: value internals the model cannot see

The model abstracts a value's insides to a tag (`Obj("complete")`, `Rows("ragged")`),
so it cannot see nested values. `packages/webapp/test/submission-cell-fuzz.test.tsx`
covers them: seeded random JSON (plus near-valid shapes per kind) goes through the
real `fieldValuesToAnswers`, a JSON round trip, the resolver's special-field and
payment handling, and is then rendered by `SubmissionCell` as a table cell and in
the detail view, and run through `answersToPlain` / `Html` / `Json` / `ApiObject`.
A third pass renders arbitrary stored values under any kind (old submissions, or
a field whose kind changed) without validation. It runs a short pass with the unit
tests; `FUZZ_SEED` / `FUZZ_ITER` run longer ones (20 seeds × 2,000 iterations pass).

What it found, all fixed:

| Value | Was | Now |
| --- | --- | --- |
| multiple choice `{value: [], other: {a: 1}}` | stored; **crashed the table** and the detail view | rejected; the cell renders only text |
| input table `[{col1: {a: 1}}]` | stored; crashed the detail view | rejected; cells render only plain values |
| address `{address1: {a: 1}, …}` | stored; crashed the detail view | rejected; parts render only text |
| choice answer whose `value` is not an array; payment `amount` like `"+1"` | crashed the cell (old data only) | rendered safely |
| number / rating `[3]`, rating `"3abc"` | stored | rejected |
| date range `{}`, phone number `[null]` | `TypeError` (400 with no message) | `ValidateError` |

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
| `EndingFor(order, values, partial)` | `resolveEnding()` — walk `[...questions, ...endings]` with `applyLogicToFields`, slice a partial submission with `sliceFieldsByLogics`, then ask the last field's logic / `nextFieldId` / fall back to the first ending **of the list it is given** |
| `TouchedOf` / `SliceFrom` | the `isTouched` mutation in `applyLogicToFields` and `sliceFieldsByLogics` |
| `ClientOrder` / `ClientDiscard` | `Renderer.tsx` `initStore` + `Form.tsx` / `Header.tsx`: `resolveEnding(getEndingRouteFields(allFields, thankYouFields), …)` |
| `ServerDiscard` | `isSubmissionDiscarded()`: a discarding ending must exist, no variable may carry logic, and *both* the full projection and the one without payment fields must end there |
| `ServerRoute` / `AllAnswersValid` | `completeSubmission`: `applyLogicToFields` over `flattenFields(form.fields, true)` in document order, then `selectSubmissionFields` (a partial submission without an unresolved jump field is rejected) |
| `ShownEnding(path, …)` | `setIsSubmitted({thankYouFieldId})` + `Blocks.tsx` looking the id up in `state.thankYouFields` |

The two sides see different fields, in a different order — that is the whole
risk. The renderer's `allFields` drops welcome screens, empty groups and (when
Stripe is off) payment fields, and keeps an ending nested in a group at its
group's position; the top-level endings are appended after it. The server keeps
every form field in document order but drops empty groups. Two flags select the
code under test: `topLevelEndingsOnly` (both sides decide from top-level endings
only, the fix) and `countdownShowsEnding` (the time limit shows the resolved
ending, the fix); `DiscardLegacyForm` turns both off.

`MCDiscard` enumerates **all** answer maps (4 values over 7 fields), both
submission paths (the time limit is always partial, as in `Header.tsx`) and both
payment setups: 98,304 states.

### Results

- `MCDiscard` / `MCDiscardVar` / `MCDiscardGroup` **pass**: the server never
  discards a response the renderer would have saved (`NoDataLoss`), and the two
  sides resolve the same ending (`EndingsAgree`), so the renderer never drops a
  response the server would keep (`ClientDiscardIsServerDiscard`).
- `MCDiscardLegacy` **fails** on the code as #387 shipped it: with `q1 = "x"`,
  `q2 = ""` (no jump to an ending) the renderer falls back to `nested`, which
  discards, and the server falls back to `ok`. The first version of this model
  passed that form because it kept the renderer's fields in document order, and
  `NoDataLoss` only checks one direction.
- `MCDiscardGroupBroken` **fails**: delete the empty-group filter from
  `isSubmissionDiscarded` and the server follows a group the renderer dropped,
  reaches the discarding ending and throws away a response the respondent saw
  as saved. The filter is load-bearing, not defensive.
- `MCDiscardShown` / `MCDiscardCountdown` **pass** and their `*Legacy` variants
  fail, for findings 2 and 3 below.

### Review of the PR

Checked against the code on `pr-387` (`ac07545`), which is merged into this branch
with the fixes below.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | **bug** | A discarded submission still consumed the form's **IP limit**: `submissionIpLimitService.checkIp()` runs (and increments the counter) before the discard check in `completeSubmission`, so screened-out visitors used up the allowance. | **Fixed**: `checkIp()` runs after the discard return. `submission-discard.test.ts` checks both routes. |
| 2 | **bug** | An ending **nested in a group** became the renderer's **fallback**: `allFields` keeps it, and it comes before the top-level endings in the list given to `resolveEnding`. Every route without an explicit jump then resolved to it — discarding the response if it discards, and showing the generic screen because `state.thankYouFields` only holds top-level endings — while the server fell back to the first top-level ending. Before #387 the default was the first top-level ending. Only reachable through stored data: endings sit outside every `ReactSortable` in the builder, so they cannot be dragged into a group. | **Fixed**: both sides decide from top-level endings only (`getEndingRouteFields`, and the filter in `isSubmissionDiscarded`). Tests in `ending-route-fields.test.ts`, `branch-submission.test.tsx` and `submission-discard.test.ts`. |
| 3 | **bug (minor)** | On the **time-limit path** `Header.tsx` passed `thankYouFieldId` only when it discarded, so a saved submission showed the generic screen instead of the ending its route reaches, and `countdown-submission.test.tsx` asserted `'none'`. | **Fixed**: it always passes the resolved ending; the test asserts `'saved'`. |
| 4 | nit | `isSubmissionDiscarded` calls `resolveEnding` twice and `resolveEnding` walks + clones the field list twice, so every submission on a form with a discarding ending costs 4 `applyLogicToFields` walks and 4 clones of every field. Forms without such an ending are unaffected (early return). | Left as is |
| 5 | nit | `getNavigateFieldId` re-implements destination checking as "is the target a thank-you field", without `createFieldNavigation`'s forward-only / jumpable-source rules. Unreachable in practice (`removeInvalidNextFieldIds` prunes stale targets on save) and harmless while both sides call `resolveEnding`. | Left as is |
| 6 | note | The date fix (`isSameDate`/`isBeforeDate`/`isAfterDate` return false for a nil value instead of dayjs reading "now") changes routing for **every** form: a rule like "is before today" on an unanswered date stops firing. Correct, but it deserves a changelog line. | — |
| 7 | note | The two conservative divergences are deliberate: forms with variable rules, and routes where payment fields change the ending, are kept by the server even if a stale tab posts them. The model confirms they can only *keep* a response (`MCDiscardVar`). | — |

### Open, pre-existing: the time limit can submit a response the server rejects

`Header.tsx` submits what was answered as a **partial** submission when the time
runs out. `selectSubmissionFields` only accepts a partial submission that stops at
a jump field the answers did not resolve (it throws `Invalid partial submission`
otherwise, so a client cannot use "partial" to skip required questions). So on a
form with a time limit and no jump logic, or once every jump question on the
route is answered, the server rejects a response whose answers are all valid.
`MCCountdownRejected` shows it on `DiscardForm`, and the resolver rejects
`{q1: 'half an answer'}` with `partialSubmission: true` on a form without logic.
This is on `next` already and not part of #387; fixing it means deciding when the
server may accept a partial submission without that proof (for example once the
open token shows the time limit has passed), so it is left open here.

## Out of scope / extension points

- **Property drift, not just kind drift.** Switching a kind also leaves the old
  `choices`, `total` and `tableColumns` in place. Model an action
  `ChangeProperties(fid, choices, total)` and check that stored choice answers
  stay a subset of the *current* options, and that `InputTableItem` cells
  resolve against the current columns.
- **Partial submissions in `FormFlow.tla`.** `Discard.tla` models
  `selectSubmissionFields` (`ServerRoute`); `FormFlow.tla` still only submits
  complete walks.
- **Group fields.** `flattenFields(fields, true)` keeps the group itself in the
  walk; the model treats `group` like a statement (never answered), which is
  what `fieldsToValidateRules` does.
- **Payments.** The resolver overwrites the answer with
  `resolvePaymentConfiguration(...)`, so a respondent cannot choose the amount.
  The model only checks the stored shape (`Obj("complete")`); the amount
  invariant would be `paymentAnswer.value.amount = round(price * 100)`.
- **Time.** There is no clock in the model: form expiration and `submit_date` are
  orthogonal to flow and typing. The time limit is modelled only as the path that
  submits (`path = "countdown"`, always partial).

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
