# AAIR To-Do App — Full Technical Documentation

This document explains **everything** in this codebase: what the app does, why each
library/pattern was chosen, the full file structure, every screen and component,
how state is managed and persisted, every function and what it does, and how all
the pieces connect at runtime. It is meant to be read top-to-bottom by someone who
has never seen the project before.

---

## 1. What the app is

AAIR To-Do is a local-first, single-user to-do list mobile app built with **Expo /
React Native / TypeScript**. A user can:

- Add tasks with a required title, optional description, and optional due date.
- Mark tasks complete/incomplete.
- Delete tasks.
- Search and filter (All / Active / Completed) and sort (newest, oldest, due date
  ascending/descending, alphabetical) the task list.
- Add tasks by **voice**: tap a floating microphone button, speak a sentence like
  *"Buy provisions and call mom, then water the plants"*, and the app splits that
  single utterance into three separate tasks automatically.
- Switch between light and dark theme (persisted, defaults to the OS theme).

There is no backend and no login — everything lives on-device in `AsyncStorage`.
This is a deliberate scope decision (see §3) suited to a single-user offline task
list; there is no server to sync with, so nothing is lost by keeping the whole
app client-only.

---

## 2. Tech stack, and why each piece was chosen

| Technology | Used for | Why this, specifically |
|---|---|---|
| **Expo (SDK 54)** | App framework/toolchain | Removes the need to hand-maintain native iOS/Android projects for a CRUD-plus-voice app. Gives OTA-style dev workflow (`expo start`), a managed build pipeline, and first-class TypeScript support out of the box. |
| **React Native 0.81 + React 19** | UI runtime | The only realistic way to ship one codebase to iOS and Android with native performance and native UI primitives (vs. a WebView-based hybrid approach). |
| **TypeScript (strict mode)** | Language | Compile-time safety for the data model (`Task`), navigation params, and component props — catches an entire class of bugs (typos in field names, wrong prop types, `undefined` handling) before runtime. `strict: true` is set in [tsconfig.json](tsconfig.json). |
| **React Navigation (native-stack, v7)** | Screen-to-screen navigation | The de-facto standard RN navigation library. `native-stack` specifically renders using the platform's real native navigation controller (`UINavigationController` on iOS, Fragment-based on Android) rather than a JS-driven stack, so transitions, gestures, and header behavior feel native for free. |
| **React Context API** (`TaskContext`, `ThemeContext`) | Global state | The app has exactly two pieces of cross-cutting state: the task list and the theme. Context + `useState`/`useCallback` is enough to cover this without pulling in Redux/Zustand/MobX — adding a state-management library would be unjustified complexity for two providers. See §5 for the full rationale. |
| **`@react-native-async-storage/async-storage`** | Persistence | The standard key-value persistent store for React Native. Sufficient here because the data is a single JSON-serializable array (no relational queries, no large binary blobs) — a full SQLite/WatermelonDB setup would be overkill. |
| **`expo-speech-recognition`** | Voice-to-text | Wraps the OS-native speech recognizers (iOS `SFSpeechRecognizer`, Android `SpeechRecognizer`) so transcription happens **on-device, offline, with no API key**. This was chosen over sending audio to a cloud STT API (e.g. OpenAI Whisper) specifically to keep the app's "no configuration required" property — see §9 for the full trade-off discussion and the documented extension point if a cloud API is ever preferred. |
| **`uuid` + `react-native-get-random-values`** | Task IDs | `uuid`'s `v4()` needs a CSPRNG; React Native's JS engine doesn't provide `crypto.getRandomValues` by default, so `react-native-get-random-values` polyfills it. Imported once at the top of [TaskContext.tsx](src/context/TaskContext.tsx) before `uuid` is used anywhere. |
| **`@expo/vector-icons`** | Icons | Ships bundled with Expo, works offline, and covers every icon this app needs (checkmarks, mic, trash, calendar, search, sun/moon) via the `Ionicons` set — no need for custom SVG assets. |
| **`@react-native-community/datetimepicker`** | Due-date picking | The standard native date-picker wrapper; renders the real iOS wheel/inline picker and the real Android dialog, which is both more familiar to users and less code than a custom-built calendar widget. |
| **Jest + `jest-expo` + React Native Testing Library** | Testing | `jest-expo` is Expo's preconfigured Jest preset (correct transform/mock setup for RN + Expo modules out of the box). React Native Testing Library encourages testing components the way a user interacts with them (by text/testID/press events) rather than testing internal implementation details. |
| **`react-native-safe-area-context` / `react-native-screens`** | Layout/navigation primitives | Required peer dependencies of React Navigation's native-stack; `safe-area-context` also lets components read safe-area insets (notches, home indicators) directly. |

---

## 3. Full file structure

```
Aair_TodoApp/
├── App.tsx                        # Composition root: wraps providers, renders navigator
├── app.json                       # Expo app config (name, icon, permissions, plugins)
├── babel.config.js                # Babel preset (babel-preset-expo)
├── tsconfig.json                  # TypeScript compiler config (strict mode)
├── package.json                   # Dependencies, scripts, Jest config
├── jest.setup.js                  # Jest global setup: mocks AsyncStorage + expo-speech-recognition
├── assets/
│   └── icon.png                   # App icon (1024x1024)
├── screenshots/                   # Screenshot placeholders for submission/docs
├── src/
│   ├── types/
│   │   └── Task.ts                # All shared TypeScript types (Task, NewTaskInput, filters, nav params)
│   ├── theme/
│   │   ├── colors.ts               # Light/dark color token objects
│   │   └── ThemeContext.tsx        # Theme state (Context) + AsyncStorage persistence
│   ├── context/
│   │   └── TaskContext.tsx         # Task state (Context): CRUD actions + AsyncStorage sync
│   ├── services/
│   │   ├── storageService.ts       # Thin AsyncStorage wrapper (load/save/clear tasks)
│   │   └── voiceService.ts         # useVoiceInput hook wrapping expo-speech-recognition
│   ├── utils/
│   │   ├── taskSplitter.ts         # Splits one dictated phrase into multiple task titles
│   │   └── dateUtils.ts            # Due-date formatting + overdue check
│   ├── navigation/
│   │   └── RootNavigator.tsx       # Native-stack navigator: TaskList <-> AddTask
│   ├── screens/
│   │   ├── TaskListScreen.tsx      # Home screen: list, search, filter, sort, voice FAB
│   │   └── AddTaskScreen.tsx       # Form screen: title, description, due date
│   └── components/
│       ├── TaskItem.tsx            # A single row in the task list
│       ├── FAB.tsx                 # Floating action button (voice trigger)
│       ├── EmptyState.tsx          # "No tasks" / "No results" placeholder view
│       ├── SearchBar.tsx           # Text search input with clear button
│       ├── FilterSortBar.tsx       # Filter chips + sort-cycling button
│       └── ThemeToggle.tsx         # Sun/moon header button that flips theme
└── __tests__/
    ├── TaskItem.test.tsx           # Component test for TaskItem
    ├── dateUtils.test.ts           # Unit tests for date helpers
    └── taskSplitter.test.ts        # Unit tests for the voice-dictation splitter
```

### Why this particular structure

The `src/` tree is organized **by role, not by screen** (`types/`, `theme/`,
`context/`, `services/`, `utils/`, `navigation/`, `screens/`, `components/`)
rather than, say, a feature-folder structure (`features/tasks/`,
`features/voice/`). For an app this size (two screens, one real domain object),
role-based folders keep every kind of file in one obvious place — "where's the
persistence code?" → `services/`; "where's a formatting helper?" → `utils/` —
without introducing per-feature folder boilerplate that would only pay off once
the app has many more independent features.

---

## 4. Data model — `src/types/Task.ts`

This is the single source of truth for the app's shape. Every other file imports
its types from here rather than redefining them.

```ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string; // ISO string
  dueDate?: string;  // ISO string, optional (bonus feature)
}
```

- **`id`** — a v4 UUID, generated client-side (see §5) since there's no backend
  to assign IDs.
- **`title`** — required; enforced in the UI, not in the type system (the type
  can't express "non-empty string" — validation happens in
  [AddTaskScreen.tsx](src/screens/AddTaskScreen.tsx)).
- **`description`** — optional detail text.
- **`completed`** — boolean toggle state.
- **`createdAt`** — ISO 8601 timestamp string, set once at creation, used for
  "newest/oldest first" sorting.
- **`dueDate`** — ISO 8601 timestamp string, optional; used for due-date sorting,
  the "Today/Tomorrow/…" label, and overdue detection.

Dates are stored as **ISO strings, not `Date` objects**, because the whole task
array is round-tripped through `JSON.stringify`/`JSON.parse` for `AsyncStorage`
persistence — `Date` objects don't survive that serialization natively, but ISO
strings do (and `new Date(isoString)` reconstructs a real `Date` wherever one is
needed, e.g. in `dateUtils.ts`).

```ts
export interface NewTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
}
```
The payload shape accepted by `addTask`/`addTasksBulk` — deliberately a subset of
`Task` (no `id`, `completed`, `createdAt`) because those three fields are always
derived by `TaskContext`, never supplied by the caller.

```ts
export type SortOption = 'createdDesc' | 'createdAsc' | 'dueDateAsc' | 'dueDateDesc' | 'alphabetical';
export type FilterOption = 'all' | 'active' | 'completed';
export type ThemeMode = 'light' | 'dark';
```
String union types instead of enums — idiomatic in TypeScript/React Native code,
serializes trivially, and works directly as object keys (see
`SORT_LABELS: Record<SortOption, string>` in `FilterSortBar.tsx`).

```ts
export type RootStackParamList = {
  TaskList: undefined;
  AddTask: { prefillTitle?: string } | undefined;
};
```
This is the contract React Navigation's `native-stack` uses for compile-time
route-param checking. `TaskList` takes no params. `AddTask` optionally takes a
`prefillTitle` (defined for future use, e.g. deep-linking into "add task" with
text prefilled — not currently triggered anywhere, but the screen already reads
`route.params?.prefillTitle` as its initial title state so the plumbing is ready).

---

## 5. State management

There are exactly **two** global state containers, both implemented as React
Context + `useState`, no external state library:

### 5a. `TaskContext` — [src/context/TaskContext.tsx](src/context/TaskContext.tsx)

This is the single source of truth for the task list. Every screen/component
that needs tasks reads from it via the `useTasks()` hook — nothing else holds a
duplicate copy of the task array.

**Shape:**
```ts
interface TaskContextValue {
  tasks: Task[];
  isHydrating: boolean;
  addTask: (input: NewTaskInput) => Task;
  addTasksBulk: (inputs: NewTaskInput[]) => Task[];
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, changes: Partial<NewTaskInput>) => void;
}
```

**Internal state:**
- `tasks: Task[]` — the actual list, `useState<Task[]>([])`.
- `isHydrating: boolean` — true until the initial load from `AsyncStorage`
  finishes; screens use this to show a loading spinner instead of briefly
  flashing an empty list before persisted data arrives.
- `hasHydrated` — a `useRef(false)`, **not** state (so it doesn't trigger a
  re-render). It's a guard flag: the save-to-storage effect checks it and bails
  out until the initial load has completed. Without this guard, the very first
  render (`tasks = []`) would immediately overwrite whatever was already saved
  in `AsyncStorage` with an empty array, wiping out persisted data on every app
  launch.

**Lifecycle (two `useEffect`s):**
1. **Load on mount** — `useEffect(() => { ... }, [])` calls
   `StorageService.loadTasks()`, sets `tasks` to the result, flips
   `hasHydrated.current = true`, then `isHydrating = false`.
2. **Save on every change** — `useEffect(() => { ... }, [tasks])` fires whenever
   `tasks` changes; if `hasHydrated.current` is still `false` it returns early
   (see above), otherwise it calls `StorageService.saveTasks(tasks)`
   fire-and-forget (no loading UI for saves — they're treated as best-effort
   background writes).

**Actions (all `useCallback`-wrapped so their identity is stable across
re-renders, which matters because they're dependencies of the memoized context
value and of consumers' own `useEffect`/`useCallback` hooks):**

- `addTask(input)` — builds a full `Task` (generates `id` via `uuidv4()`, trims
  `title`, normalizes empty `description` to `undefined`, sets `completed:
  false` and `createdAt: new Date().toISOString()`), **prepends** it to the
  array (`[newTask, ...prev]` — newest task appears first by default), and
  returns the created `Task` to the caller (used by `AddTaskScreen` to know
  the save succeeded before navigating back).
- `addTasksBulk(inputs)` — same construction logic as `addTask` but for an
  array of inputs at once, all sharing one `now` timestamp. This exists
  specifically for the **voice input flow**: one dictation can produce several
  task titles (via `splitDictationIntoTasks`), and they should all land in the
  list together rather than one at a time. Returns the created tasks so
  `TaskListScreen` can show "Added 3 tasks: …" confirmation banner text.
- `toggleComplete(id)` — maps over `tasks`, flips `completed` on the task whose
  `id` matches, leaves everything else untouched (`t.id === id ? {...t,
  completed: !t.completed} : t`).
- `deleteTask(id)` — filters the task with that `id` out of the array.
- `updateTask(id, changes)` — merges a partial `NewTaskInput` into the matching
  task; if `title` is part of `changes` it gets trimmed, otherwise the existing
  title is kept as-is. (Not currently wired to any UI — provided as a general
  CRUD primitive for future "edit task" functionality.)

**Why Context instead of Redux/Zustand/Jotai/MMKV-backed state:** the entire
app has one collection (`tasks`) and five mutations on it. Context +
`useCallback` + a `useMemo`'d value object gives referential stability (so
consumers don't re-render needlessly) with zero new dependencies and zero
boilerplate (no actions/reducers/selectors to maintain). This is a conscious
right-sizing decision, not an oversight — if the app grew to have many
independent slices of state with complex cross-slice derived data, a dedicated
state library would become worth its cost; it isn't here.

`useTasks()` throws if called outside a `TaskProvider` (`if (!ctx) throw new
Error(...)`) — this converts a whole class of "provider not mounted" bugs from
a silent `undefined`-property crash somewhere deep in a component into an
immediate, clear error at the call site.

### 5b. `ThemeContext` — [src/theme/ThemeContext.tsx](src/theme/ThemeContext.tsx)

Same Context pattern, separate concern (visual theme, not data).

**Shape:**
```ts
interface ThemeContextValue {
  mode: ThemeMode;         // 'light' | 'dark'
  colors: ThemeColors;     // the active palette object
  toggleTheme: () => void; // flips light <-> dark
  setMode: (mode: ThemeMode) => void; // sets an explicit mode
  isHydrating: boolean;
}
```

**Initial state:** `mode` starts as whatever `Appearance.getColorScheme()`
reports (the OS-level light/dark setting) — so before any user preference is
loaded, the app already matches the device's current theme rather than
defaulting to a hardcoded light or dark mode.

**Hydration:** on mount, `AsyncStorage.getItem('@aair_todo/theme_mode')` is read;
if it's `'light'` or `'dark'`, that overrides the OS-derived default (i.e. an
explicit user choice always wins over the system setting once one has been
made). `isHydrating` is exposed but, unlike `TaskContext`, nothing currently
gates rendering on it — the OS-derived default is already a reasonable value to
paint immediately, so there's no loading-spinner step for theme.

**`toggleTheme()` / `setMode()`** both funnel through `persistMode(next)`,
which updates React state (`setModeState`) and writes to `AsyncStorage`
(`@aair_todo/theme_mode` key) in the same call — so the choice survives app
restarts.

**`colors`** is derived with `useMemo(() => mode === 'dark' ? darkColors :
lightColors, [mode])` — recomputed only when `mode` actually changes, not on
every render.

---

## 6. Persistence layer

### 6a. `storageService.ts` — [src/services/storageService.ts](src/services/storageService.ts)

A deliberately thin wrapper around `AsyncStorage`, exposing exactly three
methods:

```ts
StorageService.loadTasks(): Promise<Task[]>
StorageService.saveTasks(tasks: Task[]): Promise<void>
StorageService.clearAll(): Promise<void>
```

- `loadTasks()` reads the raw JSON string at key `@aair_todo/tasks`, and
  defensively handles every failure mode: no stored value → `[]`; JSON that
  doesn't parse → caught, logged via `console.warn`, returns `[]`; parsed value
  that isn't an array (corrupted/foreign data) → `[]`. **The rest of the app
  never has to think about storage failures** — `loadTasks()` always resolves
  to a valid `Task[]`, never rejects.
- `saveTasks(tasks)` stringifies and writes; failures are caught and logged,
  not thrown — a failed save shouldn't crash the app or interrupt the user's
  flow (the in-memory state in `TaskContext` remains correct even if the write
  to disk momentarily failed; the next successful save will catch it up).
- `clearAll()` removes the key entirely (not currently called from any UI —
  exposed for debugging/future "reset app" functionality).

**Why isolate this instead of calling `AsyncStorage` directly from
`TaskContext`:** the docstring in the file states the reason directly — it
makes swapping the persistence backend (SQLite, MMKV, a real backend API) a
one-file change with an identical async contract, instead of a search-and-
replace across every component that touches tasks.

**Storage keys used by the app (both under the `@aair_todo/` namespace to avoid
colliding with any other library's `AsyncStorage` keys):**
| Key | Written by | Shape |
|---|---|---|
| `@aair_todo/tasks` | `storageService.ts` | JSON-stringified `Task[]` |
| `@aair_todo/theme_mode` | `ThemeContext.tsx` (directly) | the literal string `"light"` or `"dark"` |

### 6b. How persistence ties into the render cycle

1. App boots → `TaskProvider` mounts with `tasks = []`, `isHydrating = true`.
2. `TaskListScreen` sees `isHydrating === true` and renders a centered
   `ActivityIndicator` instead of the list (see [TaskListScreen.tsx:115-121](src/screens/TaskListScreen.tsx)).
3. The load effect resolves, `tasks` is set to the persisted array,
   `isHydrating` flips to `false` → the screen re-renders showing the real list
   (or the empty state if the array is empty).
4. From then on, every mutation (`addTask`, `toggleComplete`, `deleteTask`, …)
   updates `tasks` via `setTasks`, which triggers the save-effect, which
   fire-and-forgets a write to `AsyncStorage`. The UI never waits on the save —
   it already reflects the new in-memory state instantly (optimistic by
   construction, since there's no server round-trip to wait for).

---

## 7. Navigation — [src/navigation/RootNavigator.tsx](src/navigation/RootNavigator.tsx)

A single native-stack navigator with two screens:

```
TaskList  (initial route)  ⇄  AddTask
```

- `createNativeStackNavigator<RootStackParamList>()` — typed against the shared
  `RootStackParamList` from `types/Task.ts`, so `navigation.navigate('AddTask',
  {...})` and `route.params` are type-checked at every call site.
- **Theme integration:** `RootNavigator` reads `useTheme()` and builds a
  `navigationTheme` object by spreading React Navigation's own `DefaultTheme`/
  `DarkTheme` and overriding `background`, `card`, `text`, `border`, `primary`
  with the app's own color tokens — this makes the native header bar, screen
  background, and back-button tint all follow the app's light/dark palette
  instead of React Navigation's default blue/white.
- `screenOptions` sets a consistent header style (surface-colored background,
  themed tint, no shadow line under the header, bold title) and
  `animation: 'slide_from_right'` for screen transitions (the native default,
  set explicitly).
- Two `<Stack.Screen>` entries: `TaskList` (title "My Tasks") and `AddTask`
  (title "Add Task", no explicit options beyond the title — it inherits
  `screenOptions`).

`RootNavigator` is itself wrapped in `<NavigationContainer>`, which is required
exactly once at the root of any React Navigation tree (owns the navigation
state/history).

---

## 8. Screens

### 8a. `TaskListScreen` — [src/screens/TaskListScreen.tsx](src/screens/TaskListScreen.tsx)

The home/default screen. Responsibilities:

**Local state:**
- `query: string` — search text.
- `filter: FilterOption` — `'all' | 'active' | 'completed'`.
- `sort: SortOption` — one of the five sort modes.
- `lastVoiceTasks: string[]` — titles most recently added by voice, used to
  render the "Added N tasks: …" confirmation banner; cleared when a new voice
  session starts.

**Data it reads:** `tasks`, `isHydrating`, `toggleComplete`, `deleteTask`,
`addTasksBulk` from `useTasks()`; `colors` from `useTheme()`; `status`, `start`,
`stop`, `errorMessage`, `isAvailable` from `useVoiceInput(handleFinalTranscript)`.

**Derived list (`filteredSortedTasks`, wrapped in `useMemo`, recomputed only
when `tasks`/`query`/`filter`/`sort` change):**
1. Filter by search query — case-insensitive substring match against `title`
   OR `description`.
2. Filter by `filter` — `active` keeps `!completed`, `completed` keeps
   `completed`, `all` keeps everything.
3. Sort — a `switch` over `SortOption`:
   - `createdAsc`/`createdDesc` — compares `createdAt` timestamps.
   - `alphabetical` — `localeCompare` on `title`.
   - `dueDateAsc`/`dueDateDesc` — compares `dueDate` timestamps, with tasks
     that have **no** due date sorted as `Infinity` (i.e. always pushed to the
     end regardless of ascending/descending direction — a task with no due
     date is never "more overdue" or "more due soon" than one that has a
     date).

**Functions:**
- `handleFinalTranscript(transcript)` — the callback passed into
  `useVoiceInput`. Runs the transcript through `splitDictationIntoTasks`, and
  if that produces at least one title, calls `addTasksBulk` and stores the
  resulting titles in `lastVoiceTasks` for the confirmation banner. If the
  splitter returns zero titles (e.g. silence or filler-only speech), nothing
  is added and no banner shows.
- `handleFabPress()` — the FAB's `onPress`. If `!isAvailable` (voice module
  couldn't initialize — e.g. running in plain Expo Go without a dev client), it
  shows an `Alert` explaining why, rather than attempting to start and failing
  silently or crashing. Otherwise: if currently `listening`, calls `stop()`;
  else clears `lastVoiceTasks` and calls `start()`.
- `cycleSort()` — advances `sort` to the next entry in the fixed `SORT_CYCLE`
  array (`['createdDesc','createdAsc','dueDateAsc','dueDateDesc',
  'alphabetical']`), wrapping back to the start — this is what the sort chip
  in `FilterSortBar` triggers on each tap, so repeated taps cycle through
  every sort mode.
- `confirmDelete(id)` — wraps `deleteTask` behind a native `Alert.alert`
  confirmation dialog (Cancel / Delete-destructive) so a single mis-tap can't
  silently destroy a task.

**`useLayoutEffect`** sets the native header's right-side content
(`headerRight`) to a `ThemeToggle` button plus an "add task" icon button that
navigates to `AddTask` — done via `navigation.setOptions` rather than static
`options` on the `<Stack.Screen>` because the header content needs to close
over `colors.primary`, which can change at runtime when the theme toggles.

**Render structure (top to bottom):**
1. `SearchBar` + `FilterSortBar` — only rendered once there's at least one task
   at all (`!noTasksAtAll`); no point showing search/filter controls over an
   empty list.
2. Voice confirmation banner — only when `lastVoiceTasks.length > 0`.
3. Inline error text — only when `errorMessage` is set and `status === 'error'`.
4. Either: `ActivityIndicator` (while hydrating), `EmptyState` ("No tasks yet",
   shown when the task list is genuinely empty), `EmptyState` ("No matching
   tasks", shown when filters/search produced zero results from a non-empty
   list), or the `FlatList` of `TaskItem`s.
5. `FAB` — always rendered (absolute-positioned), regardless of list state.

### 8b. `AddTaskScreen` — [src/screens/AddTaskScreen.tsx](src/screens/AddTaskScreen.tsx)

The "create a task" form.

**Local state:** `title`, `description` (plain strings), `dueDate: Date | null`,
`showPicker: boolean` (controls whether the native date picker is visible),
`titleError: string | null`.

`title` initializes from `route.params?.prefillTitle ?? ''` (see §4 — currently
always `''` in practice since nothing passes `prefillTitle` yet, but the screen
is ready for it).

**Functions:**
- `handleSave()` — trims `title`; if empty, sets `titleError` and returns
  without saving (this is the app's empty-title edge case handling). Otherwise
  calls `addTask({ title, description: description.trim() || undefined,
  dueDate: dueDate?.toISOString() })` and navigates back
  (`navigation.goBack()`).
- `onChangeDate(_event, selected)` — the `DateTimePicker`'s `onChange` handler.
  On iOS the inline picker should stay open until the user dismisses it
  manually, so `showPicker` is kept `true`; on Android the native picker is a
  modal dialog that closes itself after a selection, so `showPicker` is forced
  back to `false` immediately (`setShowPicker(Platform.OS === 'ios')`). If a
  date was actually selected (`selected` is truthy — it can be `undefined` on
  Android if the user cancels the dialog), `dueDate` is updated.

**Form fields, in order:**
1. **Title** (`TextInput`, `autoFocus`) — required; border turns to the danger
   color and an error line appears below it if validation fails; the error
   clears itself the moment the user types again (`onChangeText` clears
   `titleError` if set).
2. **Description** (`TextInput`, `multiline`) — optional, no validation.
3. **Due date** — a pressable row that opens `showPicker`; shows "Set a due
   date" in muted text when unset, or the formatted date when set, plus an "×"
   button to clear it back to `null`. The actual `DateTimePicker` only mounts
   (`{showPicker && <DateTimePicker .../>}`) while `showPicker` is true, uses
   `mode="date"` (no time component), `display="inline"` on iOS vs the OS
   default dialog on Android, and `minimumDate={new Date()}` (can't pick a due
   date in the past).
4. **Save button** — calls `handleSave`.

The whole form is wrapped in `KeyboardAvoidingView` (`behavior="padding"` on iOS
only — Android handles this automatically via the manifest's
`windowSoftInputMode`) inside a `ScrollView` with
`keyboardShouldPersistTaps="handled"` so tapping the Save button doesn't first
require an extra tap to dismiss the keyboard.

---

## 9. Voice input — end to end

This is the most involved feature in the app, spanning one service, one utility,
one component, and one screen. Full flow:

1. **User taps the FAB** (`FAB.tsx`, bottom-right mic button) →
   `TaskListScreen.handleFabPress()`.
2. If the speech module reports itself unavailable (`isAvailable === false` —
   see below), the user sees an explanatory `Alert` instead of a silent
   failure; this is the expected state when running in plain **Expo Go**,
   since `expo-speech-recognition` is a native module that requires a custom
   dev client (see the README's "Run with voice input enabled" section).

   **Loading the native module without crashing the app:** `expo-speech-recognition`
   resolves its native module via Expo's `requireNativeModule`, which *throws a
   synchronous JS `Error`* (`Cannot find native module 'ExpoSpeechRecognition'`)
   the instant it's evaluated if the module isn't linked — which is exactly the
   case in plain Expo Go. A normal top-level `import { ExpoSpeechRecognitionModule
   } from 'expo-speech-recognition'` would let that throw happen during bundle
   evaluation, before any component or `try/catch` in the app's own code runs —
   crashing the whole app on launch (a red "runtime not ready" screen) rather
   than just disabling the mic button. To avoid this,
   [voiceService.ts](src/services/voiceService.ts) loads the module with a
   plain `require('expo-speech-recognition')` **inside a top-level
   `try/catch`**: `require()` (unlike `import`) executes at the point our code
   calls it, so the same throw is now catchable. On failure,
   `ExpoSpeechRecognitionModule` is set to `null` and `useSpeechRecognitionEvent`
   falls back to a no-op function (kept as a stand-in so the hook can still call
   it unconditionally on every render without violating the Rules of Hooks).
   Every subsequent use of `ExpoSpeechRecognitionModule` in the hook
   (`isRecognitionAvailable`, `requestPermissionsAsync`, `start`, `stop`) is
   guarded with a `null` check, so the net effect of an unlinked native module
   is simply `isAvailable: false` — never a crash.
3. Otherwise, `useVoiceInput`'s `start()` is called
   ([src/services/voiceService.ts](src/services/voiceService.ts)):
   - Requests microphone + speech-recognition permission via
     `ExpoSpeechRecognitionModule.requestPermissionsAsync()`. If denied, status
     flips to `'error'` with a permission message and recognition never starts.
   - Calls `ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults:
     true, continuous: false })`.
4. **Native events drive the hook's state** via `useSpeechRecognitionEvent`
   (one call per event name — this hook can't take a dynamic event name, so
   each event type is subscribed individually):
   - `'start'` → `status = 'listening'`, clears any previous error.
   - `'result'` → fired repeatedly while speaking. Each event carries
     `{ isFinal, results }`. While `isFinal` is `false`, the partial text
     updates `partialTranscript` (live captions, not currently rendered in the
     UI but available for future use). When `isFinal` is `true`, `status`
     becomes `'processing'`, the final transcript is handed to the
     `onFinalTranscript` callback (i.e. `TaskListScreen.handleFinalTranscript`)
     if non-empty, then `status` returns to `'idle'`.
   - `'error'` → `status = 'error'`, `errorMessage` set from the event.
   - `'end'` → if still `'listening'` (i.e. the recognizer stopped itself,
     e.g. due to silence, rather than the user tapping the FAB again), status
     resets to `'idle'`.
5. **`splitDictationIntoTasks`** ([src/utils/taskSplitter.ts](src/utils/taskSplitter.ts))
   takes the raw final transcript and turns it into zero or more task title
   strings:
   - Collapses repeated whitespace.
   - Splits on a regex matching common spoken-language list connectors:
     commas, semicolons, and the words/phrases `then`, `after that`, `also`,
     `and then`, `and also`, `and` (case-insensitive).
   - For each resulting fragment: trims it, strips a leading leftover filler
     word (`and`/`then`/`also`/`to`) that can survive the split at the start of
     a fragment, strips trailing punctuation/whitespace, and capitalizes the
     first letter.
   - Drops empty fragments (handles doubled-up connectors like "and and").
   - De-duplicates case-insensitively (so "call mom" and "Call Mom" said twice
     collapse to one task) while preserving first-seen order and casing.
   - This is a **pure, dependency-free, offline heuristic** — no network call,
     no API key, deterministic and unit-tested (`__tests__/taskSplitter.test.ts`
     covers all of the above behaviors).
6. **Back in `TaskListScreen.handleFinalTranscript`**: the resulting title
   array is passed to `addTasksBulk` (§5a), which creates one `Task` per title
   (sharing one `createdAt` timestamp) and prepends them all to the list in one
   state update. The titles are also stashed in `lastVoiceTasks` to drive the
   "Added N tasks: …" banner.
7. **Visual feedback throughout**, via `FAB.tsx`:
   - Not listening: outlined mic icon, primary theme color.
   - Listening: solid mic icon, **danger (red) background**, and a looping
     scale-pulse animation (`Animated.loop` between scale `1` and `1.18`,
     550 ms each way) — an unambiguous "I'm recording" signal.
   - Processing: a `sync` icon and a small "Processing…" label bubble above
     the button while the final transcript is being turned into tasks.

**Why on-device recognition instead of a cloud API (e.g. OpenAI Whisper):**
documented directly in the `voiceService.ts` file header and in the README —
on-device recognition means the app works **fully offline with zero API keys
or configuration**, which was prioritized for this project. The trade-off is
accepted deliberately: cloud STT models are generally more accurate,
especially for accents/background noise, but require a network call, an API
key, and per-request cost. The extension point for swapping in a cloud API is
explicitly documented as a comment block in `voiceService.ts`: record audio
with `expo-av`, POST the file to the Whisper endpoint, and feed the returned
`text` into the same `onFinalTranscript` callback — no other code needs to
change, because the rest of the pipeline (task splitting, list updates) is
decoupled from *how* the transcript was produced.

**Why the library was swapped from `@react-native-voice/voice` to
`expo-speech-recognition`:** the original implementation used
`@react-native-voice/voice`. During the Expo SDK 54 upgrade, that library was
flagged as unmaintained with no confirmed support for React Native's New
Architecture (which SDK 54 requires by default), so it was replaced with
`expo-speech-recognition` — an actively maintained equivalent with an
SDK-54-pinned release. The public shape of `useVoiceInput` (`status`,
`partialTranscript`, `errorMessage`, `isAvailable`, `start`, `stop`) was kept
identical across the swap, so no consuming screen/component needed to change.

---

## 10. Components

### `TaskItem.tsx` — [src/components/TaskItem.tsx](src/components/TaskItem.tsx)
Renders a single row: a circular checkbox (filled + checkmark icon when
`completed`, otherwise an empty outlined circle), the title (struck-through and
muted-color when completed), the description if present (also struck-through
when completed), a due-date row with a calendar icon (only if `dueDate` is set,
colored orange/red via `colors.overdue` if the task is both incomplete and past
its due date, computed with `isOverdue()`), and a trash-icon delete button.
Mounts with a fade-in + slide-up entrance animation (`Animated.parallel` of
opacity `0→1` and `translateY` `8→0`, 220 ms, native driver) — every new row
(including ones added in bulk via voice) animates in rather than popping in
instantly.

### `FAB.tsx` — [src/components/FAB.tsx](src/components/FAB.tsx)
Described fully in §9. Purely presentational — receives `status` and `onPress`
as props, has no knowledge of `TaskContext` or the voice service itself.

### `EmptyState.tsx` — [src/components/EmptyState.tsx](src/components/EmptyState.tsx)
A generic centered icon + title + subtitle placeholder, reused for two distinct
states in `TaskListScreen` ("No tasks yet" and "No matching tasks") by passing
different `title`/`subtitle`/`icon` props — avoids duplicating the same layout
twice.

### `SearchBar.tsx` — [src/components/SearchBar.tsx](src/components/SearchBar.tsx)
A themed `TextInput` with a search icon on the left and a conditional "×" clear
button on the right (only rendered once `value.length > 0`). Fully controlled —
`value`/`onChange` are owned by the parent (`TaskListScreen`'s `query` state),
so `SearchBar` itself holds no state.

### `FilterSortBar.tsx` — [src/components/FilterSortBar.tsx](src/components/FilterSortBar.tsx)
Two pieces side by side: a horizontally-scrollable row of filter chips (All /
Active / Completed — the active one filled with the primary color, the rest
outlined), and a single sort button showing the current sort mode's label
(from the `SORT_LABELS` lookup table) that cycles to the next mode on each tap.
Also fully controlled by its parent.

### `ThemeToggle.tsx` — [src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx)
A single icon button (sun icon when currently in dark mode, moon icon when
currently in light mode — i.e. the icon shown represents the mode you'd
*switch to*) that calls `toggleTheme()` from `useTheme()`. Rendered in
`TaskListScreen`'s header via `navigation.setOptions`.

---

## 11. Theming system

`src/theme/colors.ts` defines a `ThemeColors` interface (14 semantic color
roles: `background`, `surface`, `surfaceAlt`, `primary`, `primaryText`, `text`,
`textSecondary`, `textMuted`, `border`, `success`, `danger`, `overdue`,
`fabShadow`) and two concrete palettes, `lightColors` and `darkColors`,
implementing it.

Components never hardcode hex colors — they always pull from `useTheme().colors`
and reference the semantic role that matches the UI's intent (e.g. a delete
icon always uses `colors.danger`, regardless of whether that resolves to
`#EF4444` in light mode or `#F87171` in dark mode). This is what makes the
whole app re-skin correctly when `ThemeContext`'s `mode` flips — every themed
value is a lookup, not a literal, so a single state change (`mode`) cascades
through every screen's colors automatically via React's normal re-render cycle.

`RootNavigator` additionally maps these same tokens onto React Navigation's own
theme shape (§7) so the native header/background follow suit too.

---

## 12. Testing

**Stack:** Jest (test runner) + `jest-expo` (Expo's Jest preset — configures
the correct Babel transform and RN-aware mocks) + `@testing-library/react-native`
(component rendering/querying/interaction) + `@testing-library/jest-native`
(extra Jest matchers like `.toBeTruthy()` semantics tuned for RN elements).

**Global setup** — [jest.setup.js](jest.setup.js):
- Imports `@testing-library/jest-native/extend-expect` to register the extra
  matchers.
- Mocks `@react-native-async-storage/async-storage` with the library's own
  official in-memory mock (`.../jest/async-storage-mock`) — so tests that
  exercise storage-backed code don't touch real device storage and don't need
  a real native module bridge (which doesn't exist in the Jest/Node
  environment anyway).
- Mocks `expo-speech-recognition` entirely (both the `ExpoSpeechRecognitionModule`
  object and the `useSpeechRecognitionEvent` hook are replaced with `jest.fn()`
  stubs) — again because there's no real native speech recognizer available
  under Jest, and no test currently exercises the voice flow directly (it's
  exercised through manual/device testing instead, per the README).

**Test files:**
- **`__tests__/taskSplitter.test.ts`** — pure unit tests for
  `splitDictationIntoTasks`: empty/whitespace input → `[]`; a single phrase
  with no connector → one task; splitting on "and"; splitting on commas + "then";
  splitting on multiple connectors in one long sentence; case-insensitive
  de-duplication; trailing-punctuation trimming; handling doubled-up connectors
  ("and and").
- **`__tests__/dateUtils.test.ts`** — pure unit tests for `isOverdue` (past →
  true, today → false, future → false) and `formatDueDate` (today/tomorrow/
  yesterday labels, and the fallback short-date format for anything further
  out).
- **`__tests__/TaskItem.test.tsx`** — a component test: renders `TaskItem`
  wrapped in a real `ThemeProvider` (so it has valid theme colors to read),
  and asserts: title + description text render; pressing the checkbox
  (`testID="task-checkbox-{id}"`) calls `onToggle` with the task's id; pressing
  delete (`testID="task-delete-{id}"`) calls `onDelete` with the task's id; a
  task with a due date of today shows "Today" in its rendered text.

`package.json`'s `jest.collectCoverageFrom` scopes coverage collection to
`src/**/*.{ts,tsx}` (excluding `.d.ts` files) so coverage reports reflect
actual app code, not test files or config.

Run with `npm test` (or `npm run test:watch` for watch mode).

---

## 13. Configuration files

### `app.json`
Expo's app manifest. Key sections:
- `name`/`slug`/`version` — app identity.
- `icon` — points at `assets/icon.png` (1024×1024).
- `splash.backgroundColor` — solid indigo splash screen background (`#4F46E5`,
  matching the light theme's `primary` color) shown while the JS bundle loads.
- `ios.infoPlist` — `NSMicrophoneUsageDescription` and
  `NSSpeechRecognitionUsageDescription`, the required user-facing permission
  prompts iOS shows before granting mic/speech access.
- `android.permissions` — `RECORD_AUDIO`.
- `plugins` — `expo-speech-recognition` (configured with the same permission
  prompt strings, plus Android package-visibility entries it needs), and the
  auto-added `expo-font`/`expo-asset` config plugins (required by
  `@expo/vector-icons`, which depends on both).

### `babel.config.js`
A single preset: `babel-preset-expo` — Expo's all-in-one Babel config that
handles JSX, TypeScript stripping, and the platform-specific transforms RN
needs (this one line is sufficient; no manual plugin list is needed for this
app since it uses no Babel-dependent libraries like Reanimated).

### `tsconfig.json`
Extends `expo/tsconfig.base` (Expo's recommended TS compiler defaults for RN),
turns on `strict: true` explicitly, and declares a `@/*` → `src/*` path alias
(available for use, though the codebase currently uses relative imports like
`../theme/ThemeContext` throughout rather than the alias).

### `package.json` — scripts
| Script | Command | Purpose |
|---|---|---|
| `start` | `expo start` | Boots the Metro dev server; scan the QR with Expo Go or press `i`/`a` for a simulator/emulator. |
| `android` / `ios` / `web` | `expo start --android` / `--ios` / `--web` | Same, targeting a platform directly. |
| `test` | `jest` | Runs the full test suite once. |
| `test:watch` | `jest --watch` | Runs tests in watch mode. |
| `lint` | `eslint . --ext .ts,.tsx` | Lints all TS/TSX source. |

---

## 14. App boot sequence, start to finish

1. Native entry point loads `App.tsx`'s default export.
2. `<SafeAreaProvider>` mounts first (outermost) — makes safe-area insets
   available to any descendant that needs them (React Navigation's headers use
   this internally).
3. `<ThemeProvider>` mounts — synchronously initializes `mode` from
   `Appearance.getColorScheme()`, then asynchronously checks `AsyncStorage` for
   a saved override.
4. `<TaskProvider>` mounts — starts with `tasks = []`, `isHydrating = true`,
   and asynchronously loads persisted tasks.
5. `<AppInner>` renders — reads `mode` from `useTheme()` to set the native
   `<StatusBar>` style (`'light'` content on dark backgrounds, `'dark'`
   content on light backgrounds), then renders `<RootNavigator>`.
6. `RootNavigator` renders `<NavigationContainer>` → the native stack →
   `TaskListScreen` (the initial route).
7. `TaskListScreen` reads `isHydrating` from `useTasks()`; while `true`, it
   shows a spinner. The moment the task-load effect in `TaskProvider` resolves
   (typically near-instant for a small local JSON blob), `isHydrating` flips to
   `false` and the real list (or empty state) renders.
8. From here the app is fully interactive: every user action (add/toggle/
   delete/voice-add a task, change filter/sort/search, toggle theme, navigate
   to Add Task and back) flows through the two Context providers described in
   §5, with every task mutation additionally triggering a fire-and-forget
   `AsyncStorage` write so the next app launch picks up right where the user
   left off.

---

## 15. Edge cases explicitly handled in code

- **Empty task title** — `AddTaskScreen.handleSave` blocks the save and shows
  an inline error instead of creating a blank-titled task.
- **Empty task list** — `TaskListScreen` shows a dedicated `EmptyState` ("No
  tasks yet…") instead of an empty `FlatList`.
- **Empty search/filter results from a non-empty list** — a second, distinct
  `EmptyState` ("No matching tasks") so the user can tell "you have no tasks"
  apart from "your current filter matches nothing".
- **Accidental delete** — every delete goes through a native confirmation
  `Alert` (`confirmDelete`), never an immediate destructive action.
- **Voice input unavailable** (plain Expo Go, no dev client, or the OS
  genuinely has no speech recognizer) — an explanatory `Alert` instead of a
  crash or a silently-dead button.
- **Voice permission denied** — surfaced as a normal `status: 'error'` +
  `errorMessage`, rendered inline on the task list screen, not a crash.
- **Corrupted/foreign data in `AsyncStorage`** — `storageService.loadTasks()`
  falls back to `[]` rather than throwing if the stored value isn't valid JSON
  or isn't an array.
- **Storage write failures** — caught and logged, never thrown/crash the app;
  the in-memory state remains the source of truth for the current session
  regardless.
- **Tasks without a due date, under due-date sorting** — always sorted to the
  end (treated as `Infinity`) rather than colliding with actual dates at any
  particular position.
- **Repeated/doubled connectors in dictated speech** ("buy milk and and call
  mom") — the splitter drops the resulting empty fragment instead of producing
  a blank task.
- **Near-duplicate dictated phrases** ("call mom" said twice, differently
  capitalized) — de-duplicated case-insensitively so the user doesn't end up
  with two identical tasks from one dictation.
