# 22.2.0(2026-09-21)

### Feature

- Numpad decimal key ([#1641](https://github.com/NepipenkoIgor/ngx-mask/issues/1641)) — on `separator` masks with a comma `decimalMarker` (e.g. `thousandSeparator="."`) the numeric keypad decimal key now inserts `,` instead of being ignored; a `.` typed on the main keyboard is unchanged
- Signal forms numeric fields ([#1640](https://github.com/NepipenkoIgor/ngx-mask/issues/1640), PR [#1652](https://github.com/NepipenkoIgor/ngx-mask/pull/1652) by mnkprs) — the `value`/`valueChange` model typing now accepts `number | null`, so `formField` works with numeric and nullable signal form fields. Note: the public type was widened to `string | number | null | undefined`

### Fix

- Fix ([#1643](https://github.com/NepipenkoIgor/ngx-mask/issues/1643)) — `placeHolderCharacter` accepts `null` again
- Fix ([#1645](https://github.com/NepipenkoIgor/ngx-mask/issues/1645)) — multiple masks of different length (`||`) validate properly; note that 9 digits stay valid for the shorter mask because the mask truncates the value
- Fix ([#1651](https://github.com/NepipenkoIgor/ngx-mask/issues/1651)) — `inputTransformFn` updates the input when the whole value is selected and cleared with Backspace (regression since 21.1.0)
- Fix ([#1653](https://github.com/NepipenkoIgor/ngx-mask/issues/1653)) — `percent` masks work with multiple `decimalMarker` values (`['.', ',']`)
- Fix ([#1654](https://github.com/NepipenkoIgor/ngx-mask/issues/1654)) — the source map is shipped in the npm package again
- Pin ([#1639](https://github.com/NepipenkoIgor/ngx-mask/issues/1639)) — `leadZero` behavior confirmed as intended and covered by regression tests, no source change

### Chore

- All dependencies updated to the latest versions: Angular 22.1.7, Cypress 16, jsdom 30, angular-eslint 22.5, ng-packagr 22.1, eslint 10.11, typescript-eslint 8.70 (vitest stays on 4.x, the range supported by `@angular/build`)
- TypeScript stays on 6.0.x: `@angular/compiler-cli`, `ng-packagr` and `typescript-eslint` still require `typescript <6.1`
- Tailwind config renamed to `tailwind.config.mts` (removes the Node module-type warning)
- Removed the unused deprecated `@angular/platform-browser-dynamic` dependency

# 22.1.0(2026-07-20)

### Feature

- Secure date input and generalized date-field cursor fix (details in the 22.0.2 entry below, [#1574](https://github.com/NepipenkoIgor/ngx-mask/issues/1574), [#1488](https://github.com/NepipenkoIgor/ngx-mask/issues/1488))

### Fix

- Regression fixes for [#1632](https://github.com/NepipenkoIgor/ngx-mask/issues/1632), [#1633](https://github.com/NepipenkoIgor/ngx-mask/issues/1633), [#1634](https://github.com/NepipenkoIgor/ngx-mask/issues/1634) (details in the 22.0.2 entry below)

### Chore

- Dependencies upgraded, ESLint/TS strictness tightened, JSON linting migrated to eslint 10

# 22.0.2(2026-07-20)

### Feature

- Secure date input ([#1574](https://github.com/NepipenkoIgor/ngx-mask/issues/1574)) — `hiddenInput` now conceals day/month digits too (`d`/`M` tokens), not just `X`-typed placeholder digits; e.g. `mask="d0/M0/0000"` with `[hiddenInput]="true"` displays `**/**/2024` while the form control keeps the real date

### Fix

- Fix ([#1488](https://github.com/NepipenkoIgor/ngx-mask/issues/1488)) — the caret-shift-past-separator fix for overflowing `leadZeroDateTime` date/time fields now works for any date/time mask (`M0/00`, `Hh:m0`, etc.), not only the flagship `d0/M0/0000`
- Fix ([#1634](https://github.com/NepipenkoIgor/ngx-mask/issues/1634)) — `separator` masks with `outputTransformFn` no longer emit the raw formatted display string on blur; the blur-time `leadZero` reformat now routes through the same transform pipeline as every typing-time emission, so `FormControl` keeps receiving the transformed (e.g. numeric) value
- Fix ([#1633](https://github.com/NepipenkoIgor/ngx-mask/issues/1633)) — `setDisabledState` now writes the native `disabled` DOM property synchronously; an initially-disabled `FormControl` no longer briefly (or persistently) leaves the native input enabled due to the deferred `queueMicrotask` write racing Angular Forms' synchronous init
- Regression coverage ([#1632](https://github.com/NepipenkoIgor/ngx-mask/issues/1632)) — added unit and Cypress tests locking in that retyping into a `keepCharacterPositions` slot cleared by Backspace (e.g. date mask `d0/M0/0000`) fills from the first typed keystroke; already fixed by prior `keepCharacterPositions` corrections, no source change needed

# 22.0.0(2026-07-03)

### Feature

- Angular 22 support ([#1617](https://github.com/JsDaddy/ngx-mask/issues/1617)) — built and tested against Angular 22.0.5
- All dependencies updated to their latest versions (exact pins)
- Custom named mask aliases ([#1376](https://github.com/JsDaddy/ngx-mask/issues/1376), [#1091](https://github.com/JsDaddy/ngx-mask/issues/1091)) — `provideNgxMask({ maskAliases: { PHONE_BR: '(00) 00000-0000' } })`, works in directive and pipe, supports `||` multi-masks
- Banking typing mode ([#733](https://github.com/JsDaddy/ngx-mask/issues/733), [#1414](https://github.com/JsDaddy/ngx-mask/issues/1414), [#1315](https://github.com/JsDaddy/ngx-mask/issues/1315)) — opt-in `typeFromDecimals` config: digits type from the decimal end, ATM style (`5` → `0.05` → `0.57` → `5.73`)
- Default value on blur ([#1435](https://github.com/JsDaddy/ngx-mask/issues/1435)) — `defaultValueOnBlur` input/config: empty inputs receive a masked fallback on blur without marking the form dirty
- Configuration docs overhaul ([#1529](https://github.com/JsDaddy/ngx-mask/issues/1529)) — explicit standalone vs environment vs NgModule setup guide in USAGE/README

### Fix

- Fix ([#1250](https://github.com/JsDaddy/ngx-mask/issues/1250)) — typing a second decimal marker is rejected as a no-op instead of mangling the value (`123,456,789.20` stays intact)
- Fix ([#1590](https://github.com/JsDaddy/ngx-mask/issues/1590)) — `showMaskTyped` skeleton render no longer echoes `''` into the model during programmatic writes, fixing lost initial values in nested custom form controls
- Pin ([#1593](https://github.com/JsDaddy/ngx-mask/issues/1593)) — integer-part deletion keeping the decimal part and caret is now covered by dedicated regression tests (behavior fixed in 21.1.0)
- Fix ([#1513](https://github.com/JsDaddy/ngx-mask/issues/1513)) — `leadZeroDateTime` no longer injects a spurious zero into months for year-first masks (`0000-M0-d0`: `19901221` → `1990-12-21`)

### Breaking

- Requires Angular 22 (`peerDependencies: ^22.0.0`) and Node.js ≥ 22.22.3 / ≥ 24.15.0 / ≥ 26

# 21.1.0(2026-07-02)

### Feature

- Add `CPF_CNPJ_ALPHA` alphanumeric CNPJ mask (PR [#1592](https://github.com/JsDaddy/ngx-mask/pull/1592))
- Signal Forms (`[formField]`) fully supported: initial values, disabled schema, dynamic masks, validation — verified equivalent to Reactive and Template-driven across all mask types

### Fix

- Fix ([#1601](https://github.com/JsDaddy/ngx-mask/issues/1601)) — relax `FormValueControl` surface; no more conflicts with native `required`/`readonly`
- Fix ([#1560](https://github.com/JsDaddy/ngx-mask/issues/1560)) — `onChange` no longer fires during `writeValue`; programmatic `setValue`/`patchValue` keeps the form pristine
- Fix ([#1532](https://github.com/JsDaddy/ngx-mask/issues/1532)) — `separator` mask without explicit precision no longer throws `toFixed()` RangeError
- Fix ([#1607](https://github.com/JsDaddy/ngx-mask/issues/1607), [#1614](https://github.com/JsDaddy/ngx-mask/issues/1614)) — directive no longer overrides `FormControl` disabled state on init; initially-disabled controls stay disabled
- Fix ([#1355](https://github.com/JsDaddy/ngx-mask/issues/1355), [#1578](https://github.com/JsDaddy/ngx-mask/issues/1578)) — deleting the leading digit of a separator value no longer collapses remaining zeros (`1,000,000` → `000,000`, consistent for all lengths)
- Fix ([#1512](https://github.com/JsDaddy/ngx-mask/issues/1512)) — an explicitly bound empty `[specialCharacters]="[]"` is respected instead of silently falling back to defaults
- Fix ([#1551](https://github.com/JsDaddy/ngx-mask/issues/1551)) — pasting a value starting with doubled prefix characters no longer strips a prefix occurrence (regression from 18.0.1)
- Fix ([#1571](https://github.com/JsDaddy/ngx-mask/issues/1571)) — caret lands at the end after pasting into a separator mask with a prefix
- Fix ([#1347](https://github.com/JsDaddy/ngx-mask/issues/1347)) — multi-character `placeHolderCharacter` now emits a one-time warning (single character required)
- Fix ([#1527](https://github.com/JsDaddy/ngx-mask/issues/1527), [#1543](https://github.com/JsDaddy/ngx-mask/issues/1543), [#1544](https://github.com/JsDaddy/ngx-mask/issues/1544), [#1545](https://github.com/JsDaddy/ngx-mask/issues/1545), [#1489](https://github.com/JsDaddy/ngx-mask/issues/1489)) — `keepCharacterPositions` overhaul: works without `showMaskTyped`, mid-value deletion leaves placeholder gaps, selection replacement preserves layout, keystrokes are no longer eaten at special-character boundaries, plays well with `leadZeroDateTime`
- Fix ([#1615](https://github.com/JsDaddy/ngx-mask/issues/1615)) — programmatically-set values the mask cannot process at all (e.g. sentinel strings) pass through verbatim instead of being mangled (regression from 18.0.4)
- Fix ([#1547](https://github.com/JsDaddy/ngx-mask/issues/1547)) — pasting values containing both `.` and `,` with the default array `decimalMarker` no longer drops digits (last marker wins as decimal)
- Fix ([#1516](https://github.com/JsDaddy/ngx-mask/issues/1516)) — deleting digits before the decimal marker keeps the decimal part (`0.05` → `.05`, no more silent value corruption)
- Fix ([#1572](https://github.com/JsDaddy/ngx-mask/issues/1572)) — caret lands after the decimal marker when typing `.` with a prefix and `leadZero`
- Fix ([#1611](https://github.com/JsDaddy/ngx-mask/issues/1611)) — pasted/pre-populated dates parse correctly in month-first masks (`M0/d0/0000`: `01071941` → `01/07/1941`)
- Fix ([#1612](https://github.com/JsDaddy/ngx-mask/issues/1612)) — `hiddenInput` with a custom pattern symbol no longer deletes two characters on a single backspace
- Fix ([#1498](https://github.com/JsDaddy/ngx-mask/issues/1498)) — masks with multiple leading literals (`+(000)...`) auto-fill them again on the first typed character (regression from v17)
- Fix ([#1492](https://github.com/JsDaddy/ngx-mask/issues/1492)) — numeric `FormControl` values in exponential notation (`7e-7`, `1e21`) expand to plain decimals instead of rendering garbage
- Fix ([#1567](https://github.com/JsDaddy/ngx-mask/issues/1567)) — values beyond IEEE-754 precision (>15 significant digits) no longer get corrupted by rounding (`999999999999999.99` stays exact)
- Fix ([#1504](https://github.com/JsDaddy/ngx-mask/issues/1504)) — selection replacement works when the value contains a literal `*`
- Fix ([#1350](https://github.com/JsDaddy/ngx-mask/issues/1350)) — select-all + Backspace clears the input in one press (deterministic clear, fixes Firefox)
- Fix ([#1583](https://github.com/JsDaddy/ngx-mask/issues/1583)) — `||` alternation masks validate short values that complete a shorter alternative (`1||0,N`: single `0` is valid again)
- Fix ([#1523](https://github.com/JsDaddy/ngx-mask/issues/1523)) — date masks with digit tokens abutting `M0`/`d0` (`00M0d0`, `0000M0d0`) no longer misread year digits as day/month
- Fix ([#1519](https://github.com/JsDaddy/ngx-mask/issues/1519)) — non-special `placeHolderCharacter` (e.g. `X`) no longer leaks into the unmasked model value
- Fix ([#1495](https://github.com/JsDaddy/ngx-mask/issues/1495)) — initial values colliding with the suffix text (`'00'` with `suffix=":00"`) render instead of being stripped
- Fix ([#1573](https://github.com/JsDaddy/ngx-mask/issues/1573)) — formatting no longer depends on the OS/browser locale (Edge with non-US regional settings altered values); configured markers are always authoritative
- Fix ([#1379](https://github.com/JsDaddy/ngx-mask/issues/1379)) — an empty mask is a true passthrough: no programmatic value rewrites, native browser validation works
- Fix ([#1305](https://github.com/JsDaddy/ngx-mask/issues/1305), [#1264](https://github.com/JsDaddy/ngx-mask/issues/1264)) — initial values render synchronously, so Material floating labels float on init
- Fix ([#1293](https://github.com/JsDaddy/ngx-mask/issues/1293), [#1497](https://github.com/JsDaddy/ngx-mask/issues/1497)) — Android/Samsung IME: numeric masks process composition input live (model no longer stale until blur), deletions are detected via `InputEvent.inputType` (backspace works without keydown info)
- Fix ([#1515](https://github.com/JsDaddy/ngx-mask/issues/1515)) — leading-optional masks (`999SSS`) validate correctly: mandatory tokens are position-aware enforced instead of always passing
- Fix signal forms initial value rendering unmasked for literal-inserting masks (date/time/separator)
- Fix signal forms `FormField` echo corrupting masks with ambiguous unmasked form (IP)

### Breaking

- `NgxMaskDirective` no longer exposes `errors`, `dirty`, `invalid`, `pending`, `readonly`, `required`, `name` inputs (Signal Forms surface reduced to `value`/`disabled`/`touched`)

# 21.0.1(2026-01-29)

### fix

- Fix ([#1585](https://github.com/JsDaddy/ngx-mask/issues/1585))
- Fix ([#1560](https://github.com/JsDaddy/ngx-mask/issues/1560))

# 21.0.0(2026-01-28)

### fix

- Fix ([#1590](https://github.com/JsDaddy/ngx-mask/issues/1590))
- Fix ([#1591](https://github.com/JsDaddy/ngx-mask/issues/1591))

# 20.0.3(2025-08-01)

### fix

- Fix ([#1560](https://github.com/JsDaddy/ngx-mask/issues/1560))

# 20.0.2(2025-07-31)

### fix

- Fix ([#1559](https://github.com/JsDaddy/ngx-mask/issues/1559))

# 20.0.1(2025-07-31)

### fix

- Fix ([#1548](https://github.com/JsDaddy/ngx-mask/issues/1548))
- Fix ([#1551](https://github.com/JsDaddy/ngx-mask/issues/1551))

# 20.0.0(2025-07-22)

### Feature

- update ng 20.x

# 19.0.7(2024-12-20)

### Contributing

- PR ([#1520](https://github.com/JsDaddy/ngx-mask/issues/1520))
- PR ([#1522](https://github.com/JsDaddy/ngx-mask/issues/1522))
- PR ([#1509](https://github.com/JsDaddy/ngx-mask/issues/1509))
- Fix ([#1508](https://github.com/JsDaddy/ngx-mask/issues/1508))
- Fix ([#1487](https://github.com/JsDaddy/ngx-mask/issues/1487))
- Fix ([#1525](https://github.com/JsDaddy/ngx-mask/issues/1525))

# 19.0.6(2024-12-20)

### Fix

- Fix ([#1481](https://github.com/JsDaddy/ngx-mask/issues/1481))

# 19.0.5(2024-12-20)

### Fix

- Fix ([#1411](https://github.com/JsDaddy/ngx-mask/issues/1411))

# 19.0.4(2024-12-13)

### Feature

- add input property instantPrefix

### Fix

- Fix ([#1477](https://github.com/JsDaddy/ngx-mask/issues/1477))
- Fix ([#1476](https://github.com/JsDaddy/ngx-mask/issues/1476))

# 19.0.3(2024-12-05)

### Contributing Fix

- Fix ([#1455](https://github.com/JsDaddy/ngx-mask/pull/1455))

### Fix

- Fix ([#1472](https://github.com/JsDaddy/ngx-mask/pull/1472))
- Fix ([#1415](https://github.com/JsDaddy/ngx-mask/pull/1415))

# 19.0.2(2024-12-03)

### Fix

- Fix ([#1456](https://github.com/JsDaddy/ngx-mask/issues/1456))
- Fix ([#1458](https://github.com/JsDaddy/ngx-mask/issues/1458))
- Fix ([#1446](https://github.com/JsDaddy/ngx-mask/issues/1446))
- Fix ([#1457](https://github.com/JsDaddy/ngx-mask/issues/1457))

# 19.0.1(2024-11-29)

### Feature

- change @Input to input in NgxMaskDirective
- change @Output output in NgxMaskDirective
- change variables to signals in NgxMaskDirective

# 19.0.0(2024-11-22)

### Feature

- update ng 19.x

# 18.0.4(2024-11-11)

### Fix

- Fix ([#1449](https://github.com/JsDaddy/ngx-mask/issues/1449))

# 18.0.3(2024-11-05)

### Fix

- Fix ([#1372](https://github.com/JsDaddy/ngx-mask/issues/1372))
- Fix ([#1441](https://github.com/JsDaddy/ngx-mask/issues/1441))
- Fix ([#1442](https://github.com/JsDaddy/ngx-mask/issues/1442))
- Fix ([#1440](https://github.com/JsDaddy/ngx-mask/issues/1440))
- Fix ([#1409](https://github.com/JsDaddy/ngx-mask/issues/1409))

# 18.0.2(2024-11-01)

### Fix

- Fix ([#1427](https://github.com/JsDaddy/ngx-mask/issues/1427))
- Fix ([#1405](https://github.com/JsDaddy/ngx-mask/issues/1405))
- Fix ([#1426](https://github.com/JsDaddy/ngx-mask/issues/1426))
- Fix ([#1406](https://github.com/JsDaddy/ngx-mask/issues/1406))
- Fix ([#1420](https://github.com/JsDaddy/ngx-mask/issues/1420))
- Fix ([#1416](https://github.com/JsDaddy/ngx-mask/issues/1416))

# 18.0.1(2024-10-29)

### Breaking Changes

- rename "IConfig" to "NgxMaskConfig"
- rename "optionsConfig" to "NgxMaskOptions"
- change interface to type

### Fix

- Fix ([#1410](https://github.com/JsDaddy/ngx-mask/issues/1410))

# 17.1.8(2024-07-16)

### Fix

- Fix ([#1344](https://github.com/JsDaddy/ngx-mask/issues/1344))
- Fix ([#1356](https://github.com/JsDaddy/ngx-mask/issues/1356))

# 17.1.8(2024-07-16)

### Fix

- Fix ([#1344](https://github.com/JsDaddy/ngx-mask/issues/1344))
- Fix ([#1356](https://github.com/JsDaddy/ngx-mask/issues/1356))

# 17.1.7(2024-07-18)

### Fix

- Fix ([#1399](https://github.com/JsDaddy/ngx-mask/issues/1399))
- Fix ([#1360](https://github.com/JsDaddy/ngx-mask/issues/1360))
- Fix ([#1357](https://github.com/JsDaddy/ngx-mask/issues/1357))
- Fix ([#1364](https://github.com/JsDaddy/ngx-mask/issues/1364))

# 17.1.6(2024-07-16)

### Fix

- Fix ([#1342](https://github.com/JsDaddy/ngx-mask/issues/1342))

# 17.1.5(2024-07-16)

### Fix

- Fix ([#1389](https://github.com/JsDaddy/ngx-mask/issues/1389))

# 17.1.4(2024-07-16)

### Fix

- Fix ([#1389](https://github.com/JsDaddy/ngx-mask/issues/1389))

# 17.1.3(2024-07-16)

### Fix

- Fix ([#1386](https://github.com/JsDaddy/ngx-mask/issues/1386))
- Fix ([#1370](https://github.com/JsDaddy/ngx-mask/issues/1370))

# 17.1.2(2024-07-15)

### Fix

- Fix ([#1378](https://github.com/JsDaddy/ngx-mask/issues/1378))
- Fix ([#1390](https://github.com/JsDaddy/ngx-mask/issues/1390))

# 17.1.1(2024-07-05)

### Fix

- Fix ([#1383](https://github.com/JsDaddy/ngx-mask/issues/1383))

# 17.1.0(2024-07-05)

### Fix

- Fix ([#1294](https://github.com/JsDaddy/ngx-mask/issues/1294))
- Fix ([#1344](https://github.com/JsDaddy/ngx-mask/issues/1344))
- Fix ([#1365](https://github.com/JsDaddy/ngx-mask/issues/1365))

# 17.0.9(2024-07-02)

### Fix

- Fix ([#1349](https://github.com/JsDaddy/ngx-mask/issues/1349))
- Fix ([#1354](https://github.com/JsDaddy/ngx-mask/issues/1354))
- Fix ([#1369](https://github.com/JsDaddy/ngx-mask/issues/1369))
- Fix ([#1378](https://github.com/JsDaddy/ngx-mask/issues/1378))
- Fix ([#1377](https://github.com/JsDaddy/ngx-mask/issues/1377))

# 17.0.8(2024-04-30)

### Fix

- Fix ([#1358](https://github.com/JsDaddy/ngx-mask/issues/1358))

# 17.0.7(2024-03-28)

### Fix

- Fix ([#1298](https://github.com/JsDaddy/ngx-mask/issues/1298))
- Fix ([#1307](https://github.com/JsDaddy/ngx-mask/issues/1307))
- Fix ([#1306](https://github.com/JsDaddy/ngx-mask/issues/1306))

# 17.0.6(2024-03-27)

### Fix

- Fix ([#1301](https://github.com/JsDaddy/ngx-mask/issues/1301))
- Fix ([#1302](https://github.com/JsDaddy/ngx-mask/issues/1302))
- Fix ([#1292](https://github.com/JsDaddy/ngx-mask/issues/1292))

# 17.0.5(2024-03-25)

### Fix

- Fix ([#1295](https://github.com/JsDaddy/ngx-mask/issues/1295))
- Fix ([#1292](https://github.com/JsDaddy/ngx-mask/issues/1292))
- Fix ([#1314](https://github.com/JsDaddy/ngx-mask/issues/1314))
- Fix ([#1310](https://github.com/JsDaddy/ngx-mask/issues/1310))
- Fix ([#1304](https://github.com/JsDaddy/ngx-mask/issues/1304))
- Fix ([#1308](https://github.com/JsDaddy/ngx-mask/issues/1308))
- Fix ([#1299](https://github.com/JsDaddy/ngx-mask/issues/1299))

# 17.0.4(2023-12-01)

### Feat

- update v16.4.2
- update v15.2.3
- update v14.3.3
- update v13.2.2

# 17.0.3(2023-11-30)

### Feat

- update dependencies

# 17.0.2(2023-11-29)

### Feat

- update dependencies

# 17.0.2(2023-11-29)

### Fix

- Fix ([#1272](https://github.com/JsDaddy/ngx-mask/issues/1272))
- Fix ([#1270](https://github.com/JsDaddy/ngx-mask/issues/1270))
- Fix ([#1259](https://github.com/JsDaddy/ngx-mask/issues/1259))
- Fix ([#1240](https://github.com/JsDaddy/ngx-mask/issues/1240))
- Fix ([#1274](https://github.com/JsDaddy/ngx-mask/issues/1274))

# 17.0.1(2023-11-28)

### Fix

- Fix ([#1271](https://github.com/JsDaddy/ngx-mask/issues/1271))
- Fix ([#1278](https://github.com/JsDaddy/ngx-mask/issues/1278))
- Fix ([#1277](https://github.com/JsDaddy/ngx-mask/issues/1277))
- Fix ([#1269](https://github.com/JsDaddy/ngx-mask/issues/1269))
- Fix ([#1276](https://github.com/JsDaddy/ngx-mask/issues/1276))
- Fix ([#1279](https://github.com/JsDaddy/ngx-mask/issues/1279))

# 17.0.0(2023-11-08)

### Feature

- update ng 17.x
-

### Feature 16.4.2

- Upgrade version 16.4.2 with more fixes since version 17.x.x

# 16.4.1(2023-11-08)

### Fix

- Fix ([#1251](https://github.com/JsDaddy/ngx-mask/issues/1251))

# 16.4.0(2023-11-07)

### Fix

- Fix ([#1261](https://github.com/JsDaddy/ngx-mask/issues/1261))
- Fix ([#1258](https://github.com/JsDaddy/ngx-mask/issues/1258))
- Fix ([#1262](https://github.com/JsDaddy/ngx-mask/issues/1262))
- Fix ([#1254](https://github.com/JsDaddy/ngx-mask/issues/1254))
- Fix ([#1256](https://github.com/JsDaddy/ngx-mask/issues/1256))

# 16.3.9(2023-10-02)

### Fix

- Fix ([#1248](https://github.com/JsDaddy/ngx-mask/issues/1248))
- Fix ([#1246](https://github.com/JsDaddy/ngx-mask/issues/1246))
- Fix ([#1247](https://github.com/JsDaddy/ngx-mask/issues/1247))

# 16.3.8(2023-09-18)

### Fix

- Change README.md
- Fix ([#1242](https://github.com/JsDaddy/ngx-mask/issues/1242))

# 16.3.7(2023-09-18)

### Fix

- Fix ([#1238](https://github.com/JsDaddy/ngx-mask/issues/1238))

# 16.3.6(2023-09-15)

### Fix

- Fix ([#1232](https://github.com/JsDaddy/ngx-mask/issues/1232))

# 16.3.5(2023-09-14)

### Fix

- Fix ([#1225](https://github.com/JsDaddy/ngx-mask/issues/1225))

# 16.3.4(2023-09-13)

### Feat

- update version

# 16.3.3(2023-09-13)

### Fix

- Fix ([#1222](https://github.com/JsDaddy/ngx-mask/issues/1222))

# 16.3.2(2023-09-13)

### Fix

- Fix ([#658](https://github.com/JsDaddy/ngx-mask/issues/658))

# 16.3.1(2023-09-01)

### Fix

- Fix ([#877](https://github.com/JsDaddy/ngx-mask/issues/877))
- Fix ([#613](https://github.com/JsDaddy/ngx-mask/issues/613))
- Fix ([#644](https://github.com/JsDaddy/ngx-mask/issues/644))
- Fix ([#788](https://github.com/JsDaddy/ngx-mask/issues/788))

# 16.3.0(2023-08-28)

### Fix

- Fix ([#1212](https://github.com/JsDaddy/ngx-mask/issues/1212))
- Fix ([#1215](https://github.com/JsDaddy/ngx-mask/issues/1215))
- Fix ([#1210](https://github.com/JsDaddy/ngx-mask/issues/1210))
- Fix ([#1213](https://github.com/JsDaddy/ngx-mask/issues/1213))
- Fix ([#1217](https://github.com/JsDaddy/ngx-mask/issues/1217))
- Fix ([#1206](https://github.com/JsDaddy/ngx-mask/issues/1206))
- Fix ([#1211](https://github.com/JsDaddy/ngx-mask/issues/1211))

# 16.2.9(2023-08-08)

### Fix

- Fix ([#1076](https://github.com/JsDaddy/ngx-mask/issues/1076))
- Fix ([#890](https://github.com/JsDaddy/ngx-mask/issues/890))
- Fix ([#841](https://github.com/JsDaddy/ngx-mask/issues/841))
- Fix ([#1162](https://github.com/JsDaddy/ngx-mask/issues/1162))

# 16.2.7(2023-08-08)

### Fix

- Fix ([#843](https://github.com/JsDaddy/ngx-mask/issues/843))
- Fix ([#1200](https://github.com/JsDaddy/ngx-mask/issues/1200))

# 16.2.6(2023-08-03)

### Fix

- Fix ([#613](https://github.com/JsDaddy/ngx-mask/issues/613))
- Fix ([#671](https://github.com/JsDaddy/ngx-mask/issues/671))
- Fix ([#774](https://github.com/JsDaddy/ngx-mask/issues/774))
- Fix ([#1202](https://github.com/JsDaddy/ngx-mask/issues/1202))
- Fix ([#1203](https://github.com/JsDaddy/ngx-mask/issues/1203))

# 16.2.5(2023-07-24)

### Fix

- Fix ([#838](https://github.com/JsDaddy/ngx-mask/issues/838))
- Fix ([#1193](https://github.com/JsDaddy/ngx-mask/issues/1193))
- Fix ([#1199](https://github.com/JsDaddy/ngx-mask/issues/1199))

# 16.2.4(2023-07-12)

### Fix

- Fix ([#1182](https://github.com/JsDaddy/ngx-mask/issues/1182))
- Fix ([#1191](https://github.com/JsDaddy/ngx-mask/issues/1191))
- Fix ([#941](https://github.com/JsDaddy/ngx-mask/issues/941))

# 16.2.3(2023-07-05)

### Fix

- Fix ([#842](https://github.com/JsDaddy/ngx-mask/issues/842))
- Fix ([#623](https://github.com/JsDaddy/ngx-mask/issues/623))
- Fix ([#836](https://github.com/JsDaddy/ngx-mask/issues/836))
- Fix ([#752](https://github.com/JsDaddy/ngx-mask/issues/752))

# 16.2.2(2023-07-03)

### Fix

- Fix ([#1186](https://github.com/JsDaddy/ngx-mask/issues/1186))

# 16.2.1(2023-06-30)

### Fix

- Fix ([#906](https://github.com/JsDaddy/ngx-mask/issues/906))
- Fix ([#958](https://github.com/JsDaddy/ngx-mask/issues/958))
- Fix ([#977](https://github.com/JsDaddy/ngx-mask/issues/977))

# 16.2.0(2023-06-27)

### Fix

- Fix ([#724](https://github.com/JsDaddy/ngx-mask/issues/724))
- Fix ([#731](https://github.com/JsDaddy/ngx-mask/issues/731))

# 16.1.9(2023-06-21)

### Fix

- Fix ([#812](https://github.com/JsDaddy/ngx-mask/issues/812))
- Fix ([#636](https://github.com/JsDaddy/ngx-mask/issues/636))

# 16.1.8(2023-06-19)

### Fix

- Fix ([#1166](https://github.com/JsDaddy/ngx-mask/issues/1166))
- Fix ([#865](https://github.com/JsDaddy/ngx-mask/issues/865))

# 16.1.7(2023-06-14)

### Fix

- Fix ([#1171](https://github.com/JsDaddy/ngx-mask/issues/1171))

# 16.1.6(2023-06-14)

### Fix

- Fix ([#797](https://github.com/JsDaddy/ngx-mask/issues/797))

# 16.1.5(2023-06-13)

### Fix

- Fix ([#1167](https://github.com/JsDaddy/ngx-mask/issues/1167))
- Fix ([#1169](https://github.com/JsDaddy/ngx-mask/issues/1169))
- Fix ([#934](https://github.com/JsDaddy/ngx-mask/issues/934))

# 16.1.4(2023-06-13)

### Fix

- Fix ([#929](https://github.com/JsDaddy/ngx-mask/issues/929))
- Fix ([#944](https://github.com/JsDaddy/ngx-mask/issues/944))

# 16.1.3(2023-06-08)

### Fix

- Fix ([#601](https://github.com/JsDaddy/ngx-mask/issues/601))
- Fix ([#1042](https://github.com/JsDaddy/ngx-mask/issues/1042))
- Fix ([#680](https://github.com/JsDaddy/ngx-mask/issues/680))

# 16.1.2(2023-06-05)

### Fix

- Fix ([#772](https://github.com/JsDaddy/ngx-mask/issues/722))

# 16.1.1(2023-06-05)

### Fix

- Fix ([#1071](https://github.com/JsDaddy/ngx-mask/issues/1071))

# 16.1.0(2023-06-01)

### Fix

- Fix ([#889](https://github.com/JsDaddy/ngx-mask/issues/889))
- Fix ([#881](https://github.com/JsDaddy/ngx-mask/issues/881))
- Fix ([#1024](https://github.com/JsDaddy/ngx-mask/issues/1024))

# 16.0.9(2023-05-24)

### Fix

- Fix ([#933](https://github.com/JsDaddy/ngx-mask/issues/933))
- Fix ([#773](https://github.com/JsDaddy/ngx-mask/issues/773))
- Fix ([#905](https://github.com/JsDaddy/ngx-mask/issues/905))
- Fix ([#932](https://github.com/JsDaddy/ngx-mask/issues/932))
- Fix ([#853](https://github.com/JsDaddy/ngx-mask/issues/853))
- Fix ([#908](https://github.com/JsDaddy/ngx-mask/issues/908))
- Fix ([#866](https://github.com/JsDaddy/ngx-mask/issues/866))
- Fix ([#722](https://github.com/JsDaddy/ngx-mask/issues/722))

# 16.0.8(2023-05-29)

### Fix

- Fix ([#1018](https://github.com/JsDaddy/ngx-mask/issues/1018))

# 16.0.7(2023-05-26)

### Fix

- Fix ([#916](https://github.com/JsDaddy/ngx-mask/issues/916))

# 16.0.6(2023-05-25)

### Fix

- Fix ([#880](https://github.com/JsDaddy/ngx-mask/issues/880))

# 16.0.5(2023-05-24)

### Fix

- Fix ([#697](https://github.com/JsDaddy/ngx-mask/issues/697))
- Fix ([#850](https://github.com/JsDaddy/ngx-mask/issues/850))
- Fix ([#786](https://github.com/JsDaddy/ngx-mask/issues/786))

# 16.0.4(2023-05-19)

### Fix

- Fix ([#911](https://github.com/JsDaddy/ngx-mask/issues/911))
- Fix ([#854](https://github.com/JsDaddy/ngx-mask/issues/854))

# 16.0.3(2023-05-18)

### Fix

- Fix ([#1135](https://github.com/JsDaddy/ngx-mask/issues/1135))
- Fix ([#1066](https://github.com/JsDaddy/ngx-mask/issues/1066))
- Fix ([#870](https://github.com/JsDaddy/ngx-mask/issues/870))
- Fix ([#1019](https://github.com/JsDaddy/ngx-mask/issues/1019))

# 16.0.2(2023-05-16)

### Fix

- Fix ([#1146](https://github.com/JsDaddy/ngx-mask/issues/1146))

# 16.0.1(2023-05-16)

### Fix

- Fix ([#871](https://github.com/JsDaddy/ngx-mask/issues/871))
- Fix ([#920](https://github.com/JsDaddy/ngx-mask/issues/920))
- Fix ([#785](https://github.com/JsDaddy/ngx-mask/issues/785))
- Fix ([#718](https://github.com/JsDaddy/ngx-mask/issues/718))
- Fix ([725](https://github.com/JsDaddy/ngx-mask/issues/725))
- Fix ([#903](https://github.com/JsDaddy/ngx-mask/issues/903))
- Fix ([#860](https://github.com/JsDaddy/ngx-mask/issues/860))

# 16.0.0(2023-05-13)

### Feature

- update ng 16.x

<a name=15.1.5></a>

### Feature 15.2.3

- Upgrade version 15.2.3 with more fixes since version 17.x.x

### Feature 15.2.1

- Upgrade version 15.2.1 with more fixes since version 16.x.x

# 15.1.5(2023-05-12)

### Fix

- Fix ([#837](https://github.com/JsDaddy/ngx-mask/issues/837))

<a name=15.1.4></a>

# 15.1.4(2023-05-09)

### Fix

- Fix ([#1078](https://github.com/JsDaddy/ngx-mask/issues/1078))
- Fix ([#816](https://github.com/JsDaddy/ngx-mask/issues/816))
- Fix ([#925](https://github.com/JsDaddy/ngx-mask/issues/925))
- Fix ([#811](https://github.com/JsDaddy/ngx-mask/issues/811))

<a name=15.1.3></a>

# 15.1.3(2023-05-02)

### Fix

- Fix ([#1103](https://github.com/JsDaddy/ngx-mask/issues/1103))

<a name="15.1.2"></a>

# 15.1.2(2023-03-27)

### Fix

- Fix ([#1101](https://github.com/JsDaddy/ngx-mask/issues/1101))
- Fix ([#1009](https://github.com/JsDaddy/ngx-mask/issues/1009))

<a name="15.1.1"></a>

# 15.1.1(2023-04-23)

### Fix

- Close non public API

<a name="15.1.0"></a>

# 15.1.0(2023-03-10)

### Fix

- Fix ([#1077](https://github.com/JsDaddy/ngx-mask/issues/1077))

<a name="15.0.3"></a>

# 15.0.3(2023-02-20)

### Fix

- Fix ([#1069](https://github.com/JsDaddy/ngx-mask/issues/1069))

<a name="15.0.2"></a>

# 15.0.2(2022-12-26)

### Fix

- Fix README.md

<a name="15.0.0"></a>

# 15.0.1(2022-26-12)

### Fix

- separate `provideEnvironmentNgxMask` and `provideNgxMask`

<a name="15.0.0"></a>

# 15.0.0(2022-19-12)

### Fix

- update ng 15.x
- usage new standalone API

<a name="14.2.4"></a>

### Feature 14.3.3

- Upgrade version 15.2.2 with more fixes since version 17.x.x

### Feature 14.3.2

- Upgrade version 14.3.2 with more fixes since version 16.x.x
- Change MaskPipe => NgxMaskPipe
- Change MaskService => NgxMaskService
- Change MaskApplierService => NgxMaskApplierService
- Change MaskDirective => NgxMaskMaskDirective

# 14.2.4(2022-10-27)

### Fix

- Fix ([#1039](https://github.com/JsDaddy/ngx-mask/issues/1039))
- new code and styles linting rules formatting

<a name="14.2.3"></a>

# 14.2.3(2022-09-16)

### Fix

- Fix ([#1030](https://github.com/JsDaddy/ngx-mask/issues/1030))

<a name="14.2.2"></a>

# 14.2.2(2022-09-13)

### Fix

- Fix ([#960](https://github.com/JsDaddy/ngx-mask/issues/960))
- Fix ([#946](https://github.com/JsDaddy/ngx-mask/issues/946))
- Fix ([#1027](https://github.com/JsDaddy/ngx-mask/issues/1027))

<a name="14.2.1"></a>

# 14.2.1(2022-09-11)

### Fix

- package build process

<a name="14.2.0"></a>

# 14.2.0(2022-09-11)

### Fix

- update ng 14.2.1
- Fix ([#1029](https://github.com/JsDaddy/ngx-mask/issues/1029))

<a name="14.0.3"></a>

# 14.0.3(2022-06-21)

### Fix

- Fix ([#1017](https://github.com/JsDaddy/ngx-mask/issues/1017))
- Fix ([#1008](https://github.com/JsDaddy/ngx-mask/issues/1008))

<a name="14.0.2"></a>

# 14.0.2(2022-06-09)

- Fix ([#688](https://github.com/JsDaddy/ngx-mask/issues/688))

<a name="14.0.1"></a>

# 14.0.1(2022-06-06)

<a name="14.0.0"></a>

# 14.0.0(2022-06-05)

### Feature

- Update to Angular 14

<a name="13.1.15"></a>

### Feature 13.3.2

- Upgrade version 13.2.2 with more fixes since version 17.x.x

### Feature 13.2.1

- Upgrade version 13.2.1 with more fixes since version 16.x.x
- Change MaskPipe => NgxMaskPipe
- Change MaskService => NgxMaskService
- Change MaskApplierService => NgxMaskApplierService
- Change MaskDirective => NgxMaskMaskDirective

<a name="13.2.1"></a>

# 13.1.15(2022-05-29)

### Fix

- Fix ([#648](https://github.com/JsDaddy/ngx-mask/issues/648))

<a name="13.1.14"></a>

# 13.1.14(2022-05-17)

### Fix

- Fix ([#984](https://github.com/JsDaddy/ngx-mask/issues/984))

<a name="13.1.13"></a>

# 13.1.13(2022-05-09)

### Fix

- Fix ([#915](https://github.com/JsDaddy/ngx-mask/issues/915))

<a name="13.1.12"></a>

# 13.1.12(2022-04-27)

### Fix

- Fixed issue where active elements within a shadowRoot would not be found by mask
- Fix ([#909](https://github.com/JsDaddy/ngx-mask/issues/909))

<a name="13.1.11"></a>

# 13.1.11 (2022-04-25)

### Fix

- Fix ([#1000](https://github.com/JsDaddy/ngx-mask/issues/1000))

<a name="13.1.10"></a>

# 13.1.10 (2022-04-18)

### Fix

- Fix ([#948](https://github.com/JsDaddy/ngx-mask/issues/948))

<a name="13.1.9"></a>

# 13.1.9 (2022-04-13)

### Fix

- Fix ([#923](https://github.com/JsDaddy/ngx-mask/pull/923))

<a name="13.1.8"></a>

# 13.1.8 (2022-04-08)

### Feature

- Added lowercase and uppercase mask support
- Feature ([#947](https://github.com/JsDaddy/ngx-mask/issues/947))

<a name="13.1.6"></a>

# 13.1.6 (2022-04-04)

### Fix

- Ghost characters shown in input when toggling mask on/off
- Fix ([#897](https://github.com/JsDaddy/ngx-mask/issues/897))

<a name="13.1.5"></a>

# 13.1.5 (2022-04-03)

### Fix

- Fixed ([#848](https://github.com/JsDaddy/ngx-mask/issues/848))

<a name="13.1.4"></a>

# 13.1.4 (2022-03-30)

### Feature

- Function maskFilled is added
- Feature ([#917](https://github.com/JsDaddy/ngx-mask/issues/917))

<a name="13.1.3"></a>

# 13.1.3 (2022-03-28)

### Features and fixes

feature ([#940](https://github.com/JsDaddy/ngx-mask/issues/940))
Fixed ([#965](https://github.com/JsDaddy/ngx-mask/issues/965))

<a name="13.1.2"></a>

# 13.1.2 (2022-01-20)

### Features

- added triggerOnMaskChange, allow mask change to trigger onChange

<a name="13.1.1"></a>

# 13.1.1 (2022-01-12)

### Fixes

- Revision for separator logic.
- Set default decimalMarker to [".",","] instead "."

<a name="13.1.0"></a>

# 13.1.0 (2021-12-30)

### Features

- Enable non-zero-selections
- Deletion of special mask character moves just the cursor instead of deleting the character next to it

### Test/CI fixes

- Enable cypress component testing

<a name="13.0.1"></a>

# 13.0.1 (2021-12-15)

### Test/CI fixes

- the same that in 13.0.0
- fix test
- fix CI

<a name="13.0.0"></a>

# 13.0.0 (2021-11-28)

### Angular 13 release

- up all dependencies to latest
- move from tslint to eslint
- add more strict rules for tsconfig and code quality config
- build library with IVY and new angular package structure

<a name="12.0.0"></a>

# 12.0.0 (2021-05-19)

### Bug Fixes

Fixed ([#875](https://github.com/JsDaddy/ngx-mask/issues/875))
Fixed ([#892](https://github.com/JsDaddy/ngx-mask/issues/892))
Fixed ([#861](https://github.com/JsDaddy/ngx-mask/issues/861))
Fixed ([#893](https://github.com/JsDaddy/ngx-mask/issues/893))

<a name="11.1.5"></a>

# 11.1.5 (2020-03-19)

### Bug Fixes

Fixed ([#864](https://github.com/JsDaddy/ngx-mask/issues/864)) ([#863](https://github.com/JsDaddy/ngx-mask/issues/863)) ([#706](https://github.com/JsDaddy/ngx-mask/issues/706))

<a name="11.1.4"></a>

# 11.1.4 (2020-11-26)

### Bug Fixes

Remove complet mask if part of it is deleted ([#831](https://github.com/JsDaddy/ngx-mask/issues/831))

<a name="11.1.3"></a>

# 11.1.3 (2020-11-25)

### Bug Fixes

Now backspace no leaves special characters ([#692](https://github.com/JsDaddy/ngx-mask/issues/692)) ([831](https://github.com/JsDaddy/ngx-mask/pull/831))

<a name="11.1.2"></a>

# 11.1.2 (2020-11-24)

### Bug Fixes

DropSpecialCharacters false also should return prefix ([#686](https://github.com/JsDaddy/ngx-mask/issues/686)) ([830](https://github.com/JsDaddy/ngx-mask/pull/830))

<a name="11.1.1"></a>

# 11.1.1 (2020-11-24)

### Bug Fixes

Number cast bug. Now if model value number mask should return type number ([#791](https://github.com/JsDaddy/ngx-mask/issues/791)) ([#702](https://github.com/JsDaddy/ngx-mask/issues/702)) ([829](https://github.com/JsDaddy/ngx-mask/pull/829))

<a name="11.1.0"></a>

# 11.1.0 (2020-11-23)

### Bug Fixes

Copy paste event should work as expected ([#765](https://github.com/JsDaddy/ngx-mask/issues/765)) ([827](https://github.com/JsDaddy/ngx-mask/pull/827))

<a name="11.0.1"></a>

# 11.0.1 (2020-11-15)

### Bug Fixes

Difinition for form control with `{value, disable} should work ([#803](https://github.com/JsDaddy/ngx-mask/issues/803)) ([826](https://github.com/JsDaddy/ngx-mask/pull/826))

<a name="11.0.0"></a>

# [11.0.0 Update to Angular 11](2020-11-12)

Update to Angular 11

<a name="9.1.0"></a>

# [9.1.0 Directive's selector change](2020-05-20)

Change directive selector to restrict to input and textarea tags

<a name="9.0.2"></a>

# [9.0.2 Bugfix](2020-04-20)

Fix for #721 - prevent entering dots when decimal marker is comma

<a name="9.0.1"></a>

# [9.0.1 Bugfix](2020-04-08)

Fix for #715 - mark fields as touched on blur on form fields with an empty mask
Fix for #711 - stop fields being marked as dirty after a form reset

<a name="9.0.0"></a>

# [9.0.0 Update to Angular 9](2020-04-08)

Feature: Library updated to Angular 9
Feature: Can pass empty string for thousandSeparator if do not want any separation
Fix: allowNegativeNumbers works correctly when set as true or false. If false, entering a hyphen will not be allowed
Fix: stop cursor jumping around when mask is set as empty

<a name="8.2.0"></a>

# [8.2.0 bugfix and breaking change](2020-01-17)

Fix for #657 - showMaskTyped option now works correctly when set in the config
Fix for #665 - validateTime mark field as invalid immediately if value is null
Feature: Added new error page for handling 404's, and new bugs page for being a playground for bug fixing
Breaking change: Made validation error return an object named mask. If you were previously checking for a
validation error named 'Mask error' then it will need changing to just 'mask'.

<a name="8.1.7"></a>

# [8.1.7 bugfix](2019-12-27)

Fix for #369 - add thousandSeparator to separator pipe
Fix for #381 - add support to negative number in separator mask

<a name="8.1.6"></a>

# [8.1.6 bugfix](2019-10-30)

Fix for #560 - do not overwrite the mask available patterns when patterns attribute passed in value is a falsey value i.e null/undefined/false
Fix for #620 - allow delete button to work when at beginning of input and no prefix exists
Fix for #621 - validation config value now works correctly

<a name="8.1.5"></a>

# [8.1.5 bugfix](2019-10-25)

Fix for #614 - export everything from config

<a name="8.1.4"></a>

# [8.1.4 bugfix](2019-10-23)

Fix for #580 - honour the special characters that user may have specified, and prevent runtime exception occuring
Project folder structure converted over to follow Angular CLI way of libraries

<a name="8.1.3"></a>

# [8.1.3 bugfix](2019-10-23)

Fix for #590 - Problem if prefix last char is not a number

<a name="8.1.2"></a>

# [8.1.2 placeholder customisation](2019-10-11)

Placeholder can now be customised

<a name="8.1.1"></a>

# [8.1.1 bugfix](2019-10-10)

bugs fix

<a name="8.1.0"></a>

# [8.1.0 separator update](2019-11-09)

update separator

<a name="8.0.9"></a>

# [8.0.8 bugfix](2019-10-07)

bugs fix [refs: #554, #580, #582]

<a name="8.0.8"></a>

# [8.0.7 bugfix](2019-10-04)

bugs fix [refs: #579, #576, #561]

<a name="8.0.7"></a>

# [8.0.7 update date and time](2019-10-02)

Update date and time masks [refs: #571, #567, #572, #564, #558, #573]

<a name="8.0.4"></a>

# [8.0.4 bugfix](2019-09-09)

minor bug fixes

<a name="8.0.3"></a>

# [8.0.3 cursor](2019-09-04)

minor bug fixes

<a name="7.9.9"></a>

# [7.9.9 cursor](2019-05-8)

Issues fix

<a name="7.9.2"></a>

# [7.9.1 cursor](2019-04-15)

Bugs fix

<a name="7.9.1"></a>

# [7.9.1 cursor](2019-04-11)

Fix Backspace on empty input causes cursor to jump after entering a value

<a name="7.8.6"></a>

# [7.8.6 bugfix](2019-03-29)

Bugfix

<a name="7.8.5"></a>

# [7.8.5 update of returned value type](2019-03-28)

Fix returned value when input value type is number

<a name="7.8.4"></a>

# [7.8.4 decimal](2019-03-28)

Added decimal percent, fix suffix prevents decimals

<a name="7.7.3"></a>

# [7.7.3 polyfill](2019-03-28)

Added polyfill for IE11

<a name="7.7.2"></a>

# [7.7.2 dot_separator](2019-03-27)

Fix decimals

<a name="7.7.1"></a>

# [7.7.1 coma_separator](2019-03-25)

Readme update

<a name="7.7.0"></a>

# [7.7.0 coma_separator](2019-03-21)

Secure input and bugs fix

<a name="7.6.6"></a>

# [7.6.6 coma_separator](2019-03-18)

Bugs fix

<a name="7.6.4"></a>

# [7.6.4 coma_separator] (2019-03-13)

Bugs fix

<a name="7.6.0"></a>

# [7.6.0 coma_separator] (2019-03-11)

Feature: added default validation

<a name="7.5.0"></a>

# [7.5.0 coma_separator] (2019-03-11)

Bugs fix: fix minutes validation, '-' in separator, decimal part in separator and fix issues with FF/IE

<a name="7.4.6"></a>

# [7.4.6 coma_separator] (2019-02-15)

Fix coma_separator behavior

<a name="7.4.5"></a>

# [7.4.5 dependencies] (2019-02-15)

Update dev and prod dependencies

<a name="7.3.4"></a>

# [7.3.4 decimals values separator] (2019-01-17)

Added coma_separator

<a name="7.3.3"></a>

# [7.3.3 decimals values separator] (2019-01-08)

Added decimals values for separator and dot_separator

<a name="7.3.1"></a>

# [7.3.1 update separator] (2018-12-19)

Now separator can separate by dots

<a name="7.3.0"></a>

# [7.3.0 feature percent] (2018-12-14)

Added validation for percent

<a name="7.2.0"></a>

# [7.2.0 feature 24 hour forma] (2018-12-12)

Added valid 24 hour format mask and update separator

<a name="7.1.0"></a>

# [7.1.0 feature thousand separator] (2018-12-11)

Added new mask that separates number by thousands

<a name="7.0.4"></a>

# [7.0.4 fix multiple mask] (2018-12-11)

Fix multiple mask when you use the same symbols bettwen \*

<a name="7.0.3"></a>

# [7.0.3 hotfix] (2018-12-10)

hotfix

<a name="7.0.2"></a>

# [7.0.2 update of sufix] (2018-12-10)

sufix appears while you inputing data

<a name="6.5.17"></a>

# [6.5.17 fix of sufix](2018-10-09)

you can use sufix along with '\*'

<a name="6.5.16"></a>

# [6.5.16 new specialCharacters 'quotes'](2018-10-09)

You can used new specialCharacters 'quotes'

<a name="6.5.15"></a>

# [6.5.15 support for repeat mask](2018-10-08)

You can pass into mask pattern with brackets

<a name="6.4.14"></a>

# [6.4.14 fixed '\*' pattern in maskExpression](2018-10-05)

Fixed pattern '\*'

<a name="6.4.13"></a>

# [6.4.13 selection of input value and deletion of it is fixed](2018-10-05)

You can select and delete value.

<a name="6.4.12"></a>

# [6.4.12 pipe with mask expression and custom Pattern](2018-04-10)

You can pass array of expression and custom Pattern to pipe

<a name="6.3.11"></a>

# [6.3.11 fixed mask visable](2018-03-10)

Fixed when page is loaded the mask is visible

<a name="6.3.10"></a>

# [6.3.10 fixed writeValue](2018-03-10)

Fixed writeValue in directive

<a name="6.2.8"></a>

# [6.2.8 support for Mask Pipe/NgxMaskService](2018-01-10)

Added ability to use MaskPipe/NgxMaskService inside component

<a name="6.2.5"></a>

# [6.2.5 support for IE](2018-01-10)

Added poliffyls for IE

<a name="6.2.4"></a>

# [6.2.4 support for mask](2018-10-09)

Added support for using 'showMaskTyped' property to see mask while typing
Resolved issues

<a name="6.1.3"></a>

# [6.1.3 update demo, added support, resolved issues](2018-10-09)

Update of demo version
Added support to pass in value of type number or string
Resolved issues

<a name="6.1.1"></a>

# [6.1.1 support for prefix](2018-23-07)

Add support for prefix

<a name="2.9.5"></a>

# [2.9.5 support for optional character in input '?'](2018-18-06)

Add [ and ] as defoult symbols for mask

<a name="2.9.4"></a>

# [2.9.4 support for optional character in input '?'](2018-18-06)

Fix shift for cursor and updated all dependencies

<a name="2.9.3"></a>

# [2.9.3 support for optional character in input '?'](2018-29-05)

Add support for optional character in input '?'

<a name="2.8.3"></a>

# [2.8.3 support for multicharacter input '\*'](2018-29-05)

Add support for multicharacter input '\*'

<a name="2.7.3"></a>

# [2.7.3 proprioception-reinforcement](2018-08-05)

Updated all dependencies and remove usages of rxjs
