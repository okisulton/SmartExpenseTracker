## Copilot / Agent Instructions — SmartExpenseTracker

Purpose: give an AI coding agent the exact, actionable knowledge needed to be productive in this Expo + React Native repo.

High level
- Expo-managed React Native app using Expo Router (file-based routing under `app/`).
- State is persisted to device AsyncStorage via `utils/storage.ts` and surfaced through context hooks in `hooks/*` (notably `hooks/expense-store.ts` and `hooks/preferences-store.ts`).
- React Query (TanStack) is used for async reads/writes (see `app/_layout.tsx` for `QueryClientProvider`).

Quick run (development)
- Install: `npm install` (or yarn). See `package.json` scripts.
- Start dev server: `npx expo start` (script: `start`).
- Run on Android: `npm run android` -> `expo run:android` (script: `android`).
- EAS builds: `npx eas build -p android` (projects configured in `eas.json`).

Key files & where to look
- Routing / entry: `app/_layout.tsx` (QueryClient + Preferences + Expense providers; SplashScreen hide).
- Main tabs: `app/(tabs)/index.tsx`, `app/(tabs)/transactions.tsx`, `app/(tabs)/add-expense.tsx`, `app/scan-receipt.tsx`.
- Storage utilities: `utils/storage.ts` (STORAGE_KEYS and StorageUtils API: getData, setData, removeData, keyExists).
- Stores / hooks: `hooks/expense-store.ts`, `hooks/preferences-store.ts` (pattern: createContextHook + React Query + mutation via StorageUtils).
- Types: `types/expense.ts` (canonical shapes for Expense / ExpenseCategory).
- Categories constants: `constants/categories.ts` — used to map category ids and icons.

Project-specific patterns and conventions (do these exactly)
- Path alias: use imports like `@/utils/storage` or `@/hooks/expense-store` (tsconfig maps `@/*` → `./*`).
- Context-hook pattern: hooks export `[Context, useX]` via `@nkzw/create-context-hook`. Use `useExpenses()` and `usePreferences()` rather than creating new contexts manually.
- Persistence: always go through `StorageUtils` for AsyncStorage. Keys are in `STORAGE_KEYS` — do not invent new keys without rationale.
- React Query usage: reads are via `useQuery({ queryKey: [...] })` and writes via `useMutation({ mutationFn:... })`. After save onSuccess, the code invalidates queries and updates local state. Follow this pattern to add new persisted data.
- ID generation for expenses: current code uses `Date.now().toString() + Math.random().toString(36).substr(2, 9)`. Keep compatible formats if adding import/export or migrations.

AI & receipt-processing specifics
- The AI receipt flow is implemented in `app/scan-receipt.tsx`. It:
  - converts an image to base64
  - posts to an external AI endpoint (`https://toolkit.rork.com/text/llm/`) with a strict prompt
  - parses the returned `completion` field for a JSON object { amount, description, category }
  - sanitizes the values and maps `category` to `constants/categories` via `getCategoryById`
  - shows a confirmation modal and then calls `addExpense()` from `useExpenses()`
- When editing or extending AI parsing, preserve the defensive parsing and fallback rules in `scan-receipt.tsx` (look for jsonMatch/cleanup and default fallbacks). Avoid returning extraneous text from the AI — the UI expects a parsable JSON blob.

Navigation & routing notes
- File-based routing: add screens under `app/` or `app/(tabs)/`. Example: to add a tab screen, create `app/(tabs)/my-screen.tsx`.
- Route names match file paths. Example: `router.push('/transactions')` navigates to `app/(tabs)/transactions.tsx`. Modal and full-screen presentation is configured in `app/_layout.tsx` Stack screens.

Builds, scripts & checks
- `package.json` scripts: `start` (expo start), `android`/`ios` (expo run), `web`, `lint` (`expo lint`). Use `npx expo start` to run dev and debugging.
- EAS: project includes `eas.json` — use `npx eas login` then `npx eas build -p android` to produce APKs.
- Note: `reset-project` script is referenced in `package.json` but `./scripts/reset-project.js` may be missing — confirm before relying on it.

Common gotchas & quick fixes
- AsyncStorage shape changes: if you change stored shapes, add migration code in `hooks/*` or `utils/storage.ts` and bump `STORAGE_KEYS.APP_VERSION` as needed.
- SplashScreen is manually hidden in `app/_layout.tsx` — keep that call when changing the root layout to avoid stuck splash screens.
- Camera and permissions: receipt scanning requests permissions on-demand (see `scan-receipt.tsx`). Use `useCameraPermissions()` from `expo-camera` consistently.
- Be careful with large base64 payloads and timeouts when calling external AI services from the app — test on-device and handle network failures gracefully (current code uses try/catch and alerts).

Examples (copy/paste-ready)
- Import storage utils: `import { StorageUtils, STORAGE_KEYS } from '@/utils/storage';`
- Use expenses hook: `import { useExpenses } from '@/hooks/expense-store'; const { addExpense } = useExpenses();`
- Map category id: `import { getCategoryById } from '@/constants/categories'; const cat = getCategoryById('food');`

If you need more context
- Inspect `app/scan-receipt.tsx` for AI parsing rules and error handling.
- Inspect `hooks/expense-store.ts` and `utils/storage.ts` to understand persistence and mutation flows.

When done updating code
- Run `npx expo start` and test scanning/adding an expense on a physical device or emulator.
- Run `npm run lint` (`expo lint`) to check basic JS/TS linting.

Questions for the maintainer
- Is the `scripts/reset-project.js` intentionally omitted? If present, provide it so agents may use `npm run reset-project`.
- Any CI steps or tests you expect agents to run that are not visible in the repo? (There are currently no test files.)

— end of instructions —
