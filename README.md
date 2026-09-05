# Receipt Scanner

Point your camera at a receipt. Everything happens locally.

Receipt Scanner is an open-source, privacy-first mobile app that scans paper
receipts, reads them with on-device OCR, and turns them into structured,
searchable records — merchant, date, line items, tax, total. No account, no
backend, no upload. The photo and the extracted text never leave the phone.

## Features

- **On-device OCR** — text recognition runs locally via Google ML Kit. No
  network request is ever made with a receipt image or its text.
- **Structured extraction** — merchant, address, date, time, receipt number,
  currency, line items (name/quantity/unit price/total), subtotal, tax,
  discount, and total, each parsed independently.
- **Confidence-aware review** — every extracted field is flagged as
  *detected* or *needs review* before saving, and everything is editable.
- **Local history** — search and sort saved receipts by date, total, or
  merchant. No account required, fully usable offline.
- **Dark, focused UI** — a deliberate design system (see
  [`src/theme/tokens.ts`](src/theme/tokens.ts)); one violet accent used with
  restraint, monospace type reserved for numbers.

## Screenshots

_Coming soon — add screenshots or a short screen recording here once you've
run the app on a device._

## Privacy

This is the app's core premise, not an afterthought:

- Receipt photos are captured, OCR'd, and parsed entirely on-device.
- No receipt image or OCR text is ever sent to a server — there isn't one.
- No account, no analytics, no third-party tracking SDKs.
- The only data that leaves the parsing pipeline is what you choose to
  export or share yourself (not currently a feature — see Roadmap).

## Architecture

```
CameraView (expo-camera)
   → capture (photo URI)
   → OCR (ML Kit, on-device)          src/services/ocr
   → text normalization + parsing     src/services/parser
   → structured Receipt object        src/types/receipt.ts
   → review UI (editable)             src/screens/ScanResultScreen.tsx
   → local storage (SQLite)           src/services/storage
   → history / details UI             src/screens
```

Each stage is an independent module — the parser, for instance, has no
dependency on React Native at all and can be run and tested in plain
Node (see `scripts/verify-parser.ts`).

```
src/
  components/    # ui/, receipt/, scanner/ — small, reusable, no business logic
  hooks/         # useReceipts, useReceipt — data access for screens
  navigation/    # typed param lists + the root navigator
  screens/       # one file per screen, composed from components + hooks
  services/
    ocr/         # ML Kit wrapper, isolated behind our own types
    parser/      # pure text → ParsedReceipt logic (keywords, money, dates)
    storage/     # SQLite schema + repository (CRUD, search, sort)
    settings/    # currency + app preferences, persisted in the same DB
  theme/         # design tokens: color, type, spacing, radii, shadows, motion
  types/         # Receipt / ReceiptItem / ParsedReceipt domain model
  utils/         # currency + date formatting, id generation, error mapping
```

### OCR pipeline in detail

`@react-native-ml-kit/text-recognition` does the actual recognition; it's
wrapped in [`src/services/ocr/textRecognition.ts`](src/services/ocr/textRecognition.ts)
so the rest of the app depends on a small local interface (`OcrResult`,
`OcrBlock`) instead of the vendor package directly. The parser
(`src/services/parser/receiptParser.ts`) then works purely on the resulting
text: it locates the header block (merchant/address/store metadata), the
summary block (subtotal/tax/discount/total keywords, in English and
Italian), and treats everything in between as candidate line items. Money
and date parsing each handle both US-style (`1,234.56`) and European-style
(`1.234,56`) formats. A field the parser isn't confident about is returned
as `null` rather than guessed — the review screen is where the person
scanning fills those in, not the parser.

## Tech stack

- [Expo](https://expo.dev) SDK 57 (React Native 0.86, React 19.2), TypeScript in strict mode
- [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/) for capture
- [`@react-native-ml-kit/text-recognition`](https://www.npmjs.com/package/@react-native-ml-kit/text-recognition) for on-device OCR
- [`expo-sqlite`](https://docs.expo.dev/versions/latest/sdk/sqlite/) for local storage
- [React Navigation](https://reactnavigation.org) (native-stack + bottom-tabs)
- React's built-in `Animated` API for motion — deliberately not
  `react-native-reanimated`, to keep the animation layer verifiable without
  its own native build step and babel configuration (see *What hasn't been
  verified on a device* below)

## Getting started

### Prerequisites

- Node.js 20+
- An Expo account is **not** required for local development
- A physical iOS or Android device, or a simulator/emulator with camera
  support (most simulators don't have a usable camera — a real device is
  strongly recommended for anything touching the scanner)

### Install

```bash
npm install
```

### Everyday checks

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run verify-parser  # runs the parser against sample receipts, no device needed
npm run verify-sql     # runs the real storage queries against a real SQLite engine, no device needed
```

### Running the app

This app uses a native module (`@react-native-ml-kit/text-recognition`),
which means it **cannot run in Expo Go** — you need a development build:

```bash
npx expo prebuild        # generates ios/ and android/ native projects
npx expo run:ios         # or: npx expo run:android
```

After the first `run:ios` / `run:android`, day-to-day development can go
back to `npm start` and reopening the app on the device/simulator you
already built to — you only need to re-run `expo prebuild` /
`expo run:*` when native dependencies change.

### No Mac, or don't want a local native toolchain? Use EAS

`eas.json` is already set up with a `development` profile. This builds in
the cloud and gives you an installable app — no Xcode or Android Studio
required locally:

```bash
npx eas-cli@latest login          # free Expo account
npx eas-cli@latest build --profile development --platform android
# or --platform ios (still no Mac needed — the build runs on Expo's servers)
```

EAS gives you a link/QR code to install the resulting build straight onto
your device once it finishes.

### Testing checklist

Simulators/emulators mostly don't have a usable real camera, so a physical
device is what actually exercises this app's core feature. Once it's
installed:

1. Grant the camera permission when prompted.
2. Point it at a real receipt and capture.
3. Check what OCR actually pulled out — merchant, date, items, total —
   against the physical receipt.
4. Try at least one Italian and one non-Italian receipt if you can; the
   parser has separate keyword handling for each.
5. Save it, then confirm History and Details show what you'd expect.

If step 3 gets something wrong, `src/services/parser/receiptParser.ts` is
where to fix it — add the receipt's raw OCR text as a new case in
`scripts/verify-parser.ts` so the fix becomes a permanent regression check
instead of a one-off.

## What hasn't been verified on a device

In the interest of not presenting untested things as finished: this project
was built and its logic verified (type-checking, linting, and the parser's
own test script) in an environment without a native build toolchain or a
physical device attached. That means:

- **Verified**: TypeScript compiles clean, ESLint is clean, the receipt
  parser is checked against realistic sample OCR text (English and Italian
  receipts, multi-quantity lines, mixed currency formats), and every SQL
  statement the storage layer runs (schema, the upsert, cascading deletes,
  the `NULLS LAST` sort, search) is checked against a real SQLite engine in
  `scripts/verify-sql.cjs`. The full Metro bundle for both iOS and Android
  was also exported successfully — all 1,145 modules resolve and build,
  which is a stronger check than type-checking alone since it uses the
  actual bundler resolution a device would use.
- **Not yet verified**: the actual camera preview, capture, and on-device
  OCR call have not run on a real device or simulator — that's the one
  thing that fundamentally requires physical hardware this environment
  doesn't have. The integration code is checked against the OCR library's
  actual (untyped, so this was a manual check, not just `tsc` passing)
  source rather than assumed from memory, but "does ML Kit actually read
  this receipt correctly" can only be answered by running it on a device.

If something in the scanner flow needs adjusting once you run it for real,
`src/screens/ScannerScreen.tsx` and `src/services/ocr/textRecognition.ts`
are the two files most likely to need it.

## Before you publish

- `LICENSE` — copyright line still has `[Your Name]`, waiting on what
  exact name to put there

## Roadmap

- [ ] Real-time receipt edge detection (currently: manual capture, then OCR)
- [ ] Export receipts (CSV/PDF)
- [ ] Multi-currency receipts (splitting a single trip's receipts by currency)
- [ ] Category tagging and spend-by-category breakdowns
- [ ] Additional receipt-format locales beyond English/Italian keyword sets
- [ ] Optional iCloud/Drive backup of the local database (opt-in, still no
      receipt content going through a server this project runs)

## Contributing

Issues and pull requests are welcome. A few conventions this codebase
follows, worth keeping if you're extending it:

- Keep OCR/parsing logic out of components — it belongs in `src/services`,
  callable and testable without React Native.
- A parser change should keep `npm run verify-parser` passing, and ideally
  add a new sample receipt that exercises whatever you changed.
- Don't invent a value the OCR/parser genuinely didn't detect — return
  `null` and let the review screen ask the user, rather than guessing.

## License

MIT — see [LICENSE](LICENSE).
