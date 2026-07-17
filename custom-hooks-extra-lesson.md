# Lesson 2.10: Custom Hooks

> This is a supplementary lesson, not part of the standard course sequence. It was originally drafted for Lesson 2.10, which has since been restored as a coaching session (see [lesson.md](./lesson.md)). This material is retained here to be covered separately, as an extra lesson.

## Overview

- **Duration:** ~2 hours (hands-on lab)
- **Prerequisites:** Lesson 2.9 — Testing and Performance Optimisation

## Learning Objectives

By the end of this lesson, you will be able to:

1. **Extract** stateful logic from components into custom hooks to separate concerns and enable reuse
2. **Implement** `useAuth`, `useDebounce`, and `useDataLoader` as general-purpose hooks that solve real problems
3. **Explain** why each caller of a custom hook gets its own isolated state, even though the underlying logic is shared

## Introduction

The theme of Lessons 2.9 and 2.10 is: make it correct, make it fast, make it clean. Lesson 2.9 covered correctness (testing) and speed (performance optimisation). This lesson covers the third step: writing code that is easy to read, test, and reuse.

The tool for this is the custom hook. A custom hook is a plain JavaScript function whose name starts with `use`. It can call built-in hooks (`useState`, `useEffect`, `useContext`, and so on) and return whatever values the caller needs. The key insight is that a custom hook does not share state between callers, each component that calls a hook gets its own isolated state. What is shared is the logic.

Rather than adding to the CRM, you will work with a purpose-built app called `hooks-demo`. It has three panels: an authentication panel, a search panel, and a data panel. Each panel is working but messy. Your job is to refactor each one so that the component describes _what_ it needs, and the hook takes care of _how_.

---

## Setup: The `hooks-demo` App

### Scaffold the Project

Create a new Vite + React project:

```bash
npm create vite@latest hooks-demo -- --template react --eslint
cd hooks-demo
npm install
```

### Adjust the ESLint Config

Open `eslint.config.js` and add a `rules` block to the `**/*.{js,jsx}` configuration object:

```js
// eslint.config.js
{
  files: ['**/*.{js,jsx}'],
  extends: [
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    globals: globals.browser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  rules: {
    'no-unused-vars': 'warn',
    'react-refresh/only-export-components': 'off',
  },
},
```

`no-unused-vars` is downgraded to a warning so half-finished refactoring steps do not block the dev server with an error overlay. `react-refresh/only-export-components` is turned off because `AuthContext.jsx` exports both the `AuthProvider` component and the plain `AuthContext` value from the same file, a pattern this rule normally flags.

### Install json-server

You will need json-server to serve fake API data in Part 3:

```bash
npm install -D json-server
```

### Add the Database File

Create a `data` folder in the project root, then create `data/db.json` inside it:

```json
// data/db.json
{
  "contacts": [
    {
      "id": 1,
      "name": "Alice Tan",
      "email": "alice@example.com",
      "role": "admin"
    },
    { "id": 2, "name": "Bob Lim", "email": "bob@example.com", "role": "user" },
    {
      "id": 3,
      "name": "Carol Wong",
      "email": "carol@example.com",
      "role": "user"
    },
    {
      "id": 4,
      "name": "David Chen",
      "email": "david@example.com",
      "role": "admin"
    },
    { "id": 5, "name": "Eve Ng", "email": "eve@example.com", "role": "user" },
    {
      "id": 6,
      "name": "Frank Ho",
      "email": "frank@example.com",
      "role": "user"
    }
  ],
  "tags": [
    { "id": 1, "label": "React" },
    { "id": 2, "label": "TypeScript" },
    { "id": 3, "label": "Testing" },
    { "id": 4, "label": "Performance" },
    { "id": 5, "label": "Custom Hooks" },
    { "id": 6, "label": "React Query" }
  ]
}
```

### Add Scripts to `package.json`

Open `package.json` and add a `server` script:

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "json-server --watch data/db.json --port 3001"
  }
}
```

### Add the Stylesheet

The Vite boilerplate `index.css` ships with a centred, fixed-width theme that conflicts with the panel layout used in this lesson. Download [`assets/hooks-demo/index.css`](assets/hooks-demo/index.css) and copy it to `src/index.css`, replacing the existing contents. This is a small demo app, so one stylesheet is enough; there is no need for a separate `App.css`.

`index.css` is already imported in `src/main.jsx`; no change is needed there.

### Create the Context and Provider

Create `src/contexts/AuthContext.jsx`:

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useState } from "react";

export const AuthContext = createContext(null);

const FAKE_USERS = {
  admin: { name: "Alice Tan", role: "admin" },
  user: { name: "Bob Lim", role: "user" },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const login = (username, password) => {
    if (password !== "password") return false;
    const user = FAKE_USERS[username];
    if (!user) return false;
    setCurrentUser(user);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

This is a simple fake auth system. The only valid password is `"password"`, and the two valid usernames are `"admin"` and `"user"`.

### Create the Starter App Shell

Replace `src/App.jsx` with the following. This is the _messy_ starting point, all logic is inline. You will refactor it progressively through the lesson:

```jsx
// src/App.jsx
import { useContext, useState, useEffect } from "react";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";

// ─── Auth Panel (messy: reads context directly, no encapsulation) ──────────────
function AuthPanel() {
  const { currentUser, login, logout } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const ok = login(username, password);
    if (!ok) setError("Invalid username or password.");
    else setError("");
  };

  if (currentUser) {
    return (
      <div className="panel auth-panel">
        <h2>Auth</h2>
        <p>
          Logged in as <strong>{currentUser.name}</strong>
        </p>
        <p>
          Role: <strong>{currentUser.role}</strong>
        </p>
        <button onClick={logout}>Log out</button>
      </div>
    );
  }

  return (
    <div className="panel auth-panel">
      <h2>Auth</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Log in</button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="status">Try: admin / password</p>
    </div>
  );
}

// ─── Search Panel (messy: no debouncing, filters on every keystroke) ───────────
const CONTACTS = [
  "Alice Tan",
  "Bob Lim",
  "Carol Wong",
  "David Chen",
  "Eve Ng",
  "Frank Ho",
];

function SearchPanel() {
  const [query, setQuery] = useState("");

  const results = CONTACTS.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="panel">
      <h2>Search</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="result-list">
        {results.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <p className="status">
        {results.length} result{results.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Data Panel (messy: fetch logic inline) ─────────────────────────────────────
function DataPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadContacts = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3001/contacts");
        const json = await response.json();
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    loadContacts();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading)
    return (
      <div className="panel">
        <h2>Data</h2>
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="panel">
        <h2>Data</h2>
        <p className="error">Error: {error}</p>
      </div>
    );

  return (
    <div className="panel">
      <h2>Data</h2>
      <ul className="result-list">
        {data.map((contact) => (
          <li key={contact.id}>
            {contact.name} — {contact.role}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────
function AppContent() {
  return (
    <div className="app">
      <h1>hooks-demo</h1>
      <div className="panels">
        <AuthPanel />
        <SearchPanel />
        <DataPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

### Start the Servers

Open two terminal tabs:

```bash
# Terminal 1: React dev server
npm run dev

# Terminal 2: json-server
npm run server
```

Open `http://localhost:5173`. You should see three panels. Log in with `admin / password`. The search box filters names as you type. The data panel loads contacts from json-server.

This is the starting point. Everything works, but each component body is cluttered with plumbing. By the end of the lesson, each panel will be clean.

---

## Part 1: `useAuth` — Encapsulating Context (25 minutes)

### The Problem

Look at `AuthPanel` in `App.jsx`. It calls `useContext(AuthContext)` directly. Every component that needs auth must therefore:

1. Import `AuthContext` from the contexts folder
2. Import `useContext` from React
3. Call `useContext(AuthContext)` and remember the correct context object

If you rename `AuthContext` or move it to a different file, you must update the imports in every consumer. There is also no protection against calling `useContext(AuthContext)` outside the `<AuthProvider>`, you receive `null` back with no explanation.

A custom hook fixes both problems: it becomes the single place that imports `AuthContext`, and it can guard against missing providers.

### Create `useAuth`

Create a `src/hooks` folder, then create `src/hooks/useAuth.js` inside it:

```js
// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
```

The hook does three things:

1. Imports `AuthContext` itself, so callers do not need to
2. Calls `useContext` with the correct context
3. Throws a descriptive error if the hook is used outside the provider

### Update `AuthPanel`

In `src/App.jsx`, update the imports and `AuthPanel` to use the hook:

```jsx
// src/App.jsx
// Before — two imports required for auth
import { useContext, useState, useEffect } from "react";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";

function AuthPanel() {
  const { currentUser, login, logout } = useContext(AuthContext);
  // ...
}
```

```jsx
// src/App.jsx
// After — one hook import, no mention of AuthContext
import { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";

function AuthPanel() {
  const { currentUser, login, logout } = useAuth();
  // ...
}
```

The rest of `AuthPanel` is unchanged. Test by logging in and out, behaviour should be identical.

> **What the hook does not change**
>
> `useAuth` does not add new functionality and does not create new state. Each component that calls `useAuth()` reads the same context value from the same `<AuthProvider>`. The hook is purely an encapsulation, it hides _where_ the value comes from so that consuming components only need to know _what_ they get back.

### Verify the Error Guard

Temporarily add `<AuthPanel />` directly inside `App` outside the `<AuthProvider>` and reload the page. You should see a clear error: `"useAuth must be used inside <AuthProvider>"`. Remove the temporary change before continuing.

This guard would be impossible to write without the custom hook, callers using `useContext` directly would receive `null` silently.

---

## Part 2: `useDebounce` — Derived State with a Delay (30 minutes)

### Without Debouncing

Look at `SearchPanel` in `App.jsx`. It currently filters on every keystroke, with no debouncing at all:

```jsx
// src/App.jsx
const [query, setQuery] = useState("");

const results = CONTACTS.filter((name) =>
  name.toLowerCase().includes(query.toLowerCase()),
);
```

Every keystroke updates `query`, which re-renders `SearchPanel` and re-runs `.filter()` over the entire `CONTACTS` list, immediately, on every character. Typing "carol" filters the list five times: once for "c", once for "ca", once for "car", and so on, most of it wasted work the user never sees because the next keystroke arrives before they can read it. This gets worse in Part 3, where the filter is replaced by a network request, on every character typed, that would mean firing off five HTTP requests in a fraction of a second, most of them abandoned before they even return.

### How Debouncing Works

Debouncing means waiting for a pause in activity before reacting to it. Instead of showing a new filtered result on every keystroke, `SearchPanel` should wait until the user stops typing for a short moment, then update what is shown.

Update `SearchPanel` to introduce a second piece of state, `debouncedQuery`, that only catches up to `query` after a pause:

```jsx
// src/App.jsx
function SearchPanel() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = CONTACTS.filter((name) =>
    name.toLowerCase().includes(debouncedQuery.toLowerCase()),
  );
  // ...
}
```

Here is what the added lines do:

1. Every time `query` changes (on each keystroke), the `useEffect` runs.
2. It sets a 300ms timer that will copy `query` into `debouncedQuery`.
3. If `query` changes again before the timer fires, the user is still typing, the cleanup function cancels the old timer before the new one starts.
4. `debouncedQuery` only updates once the user pauses for 300ms without typing.

The result: `results` is now derived from `debouncedQuery`, not `query`, so the filtered list only *updates* once the user pauses. `SearchPanel` still re-renders, and `.filter()` still runs, on every keystroke, that part is unavoidable, since the input needs `query` to update immediately for the text box to feel responsive. What debouncing prevents is the *visible* result changing on every keystroke: `debouncedQuery` stays the same across those in-between renders, so `.filter()` keeps returning the same list until the user pauses for 300ms, at which point it runs once more against the new value. This is what actually matters in Part 3, where the filter is replaced by a network request: renders are cheap, but a request fired on every keystroke is not.

### The Problem with Writing This Inline

This pattern is correct, but it is entangled with `SearchPanel`'s other responsibilities. If a second component ever needs debouncing, a tag search, a live-filter input, you would duplicate these seven lines, including the easy-to-forget cleanup.

A custom hook extracts the pattern so any component can write:

```jsx
const debouncedQuery = useDebounce(query);
```

### Create `useDebounce`

Create `src/hooks/useDebounce.js`:

```js
// src/hooks/useDebounce.js
import { useState, useEffect } from "react";

const DELAY = 300;

export function useDebounce(value) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, DELAY);
    return () => clearTimeout(timer);
  }, [value]);

  return debouncedValue;
}
```

The hook accepts any `value` and debounces it by a fixed 300ms. It maintains its own `debouncedValue` state, schedules an update after the delay, and cancels the previous timer if `value` changes before the delay elapses.

> **Debouncing tracks time, not distinct values**
>
> `useDebounce` re-triggers its timer whenever `value` changes, even if the new value is the same as one it already emitted. Type "a", wait a moment (the filter runs on "a"), then type "o" and delete it before the next pause, the filter runs on "a" again, because from the hook's point of view this is just another change event. The hook has no memory of values it already returned, only of the most recent one. This is a reasonable trade-off: comparing every new value against every previously emitted value would add complexity for a case that rarely matters in practice, a user retyping the exact same character sequence within a fraction of a second.

### Update `SearchPanel`

Add the import at the top of `App.jsx`:

```jsx
// src/App.jsx
import { useDebounce } from "./hooks/useDebounce";
```

Then simplify `SearchPanel`:

```jsx
// src/App.jsx
// Before — seven lines of timing logic inside the component
function SearchPanel() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = CONTACTS.filter((name) =>
    name.toLowerCase().includes(debouncedQuery.toLowerCase()),
  );
  // ...
}
```

```jsx
// src/App.jsx
// After — intent is clear, mechanism is hidden
function SearchPanel() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);

  const results = CONTACTS.filter((name) =>
    name.toLowerCase().includes(debouncedQuery.toLowerCase()),
  );
  // ...
}
```

You can also remove `useEffect` from the React import line if it is no longer used elsewhere in `App.jsx`.

The component now reads as a clear statement of intent: "I have a query. Its debounced version is derived by the hook. I filter contacts by the debounced version."

> **Each caller gets its own state**
>
> If two components both call `useDebounce(query)`, each gets its own independent `debouncedValue` state. Calling a hook is like calling a function, the state lives inside the component instance that called it, not inside the hook file. What is shared is the logic, not the data.

---

### Activity (Optional): Add a Tag Search Panel (10 minutes)

Now that `useDebounce` exists, add a second search panel for the tag list without writing the debounce logic again.

**Task:** Add a `TagSearchPanel` component to `App.jsx` and display it as a fourth panel. The panel should:

1. Show a search input
2. Filter the `TAGS` list by the typed value, debounced by 300ms
3. Display the matching tags as a list

Add this constant near the top of `App.jsx`, alongside `CONTACTS`:

```js
// src/App.jsx
const TAGS = [
  "React",
  "TypeScript",
  "Testing",
  "Performance",
  "Custom Hooks",
  "React Query",
];
```

**Hints:**

1. Copy the structure of `SearchPanel`, the tag panel is nearly identical
2. Call `useDebounce(query)` the same way; the hook works for any string value
3. Filter `TAGS` with `.toLowerCase().includes(...)` the same way contacts are filtered
4. Add `<TagSearchPanel />` to the `.panels` div in `AppContent`

<details>
<summary>Reference solution</summary>

```jsx
// src/App.jsx
const TAGS = [
  "React",
  "TypeScript",
  "Testing",
  "Performance",
  "Custom Hooks",
  "React Query",
];

function TagSearchPanel() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);

  const results = TAGS.filter((tag) =>
    tag.toLowerCase().includes(debouncedQuery.toLowerCase()),
  );

  return (
    <div className="panel">
      <h2>Tags</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="result-list">
        {results.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <p className="status">
        {results.length} result{results.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
```

Add `<TagSearchPanel />` inside the `.panels` div in `AppContent`. The `useDebounce` hook is imported once and used by both panels, each with its own independent state.

</details>

---

## Part 3: `useDataLoader` — Extracting an Async Fetch (40 minutes)

### The Problem

Look at `DataPanel` in `App.jsx`. It fetches data inside a `useEffect`:

```jsx
// src/App.jsx
useEffect(() => {
  let ignore = false;

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/contacts");
      const json = await response.json();
      if (!ignore) {
        setData(json);
        setLoading(false);
      }
    } catch (err) {
      if (!ignore) {
        setError(err.message);
        setLoading(false);
      }
    }
  };
  loadContacts();

  return () => {
    ignore = true;
  };
}, []);
```

This is a lot of code for one component to carry, and it must be written again every time another component fetches data, a tags list, an orders list. Extracting it into a hook makes it reusable, the same way `useDebounce` made the timer pattern reusable.

### Create `useDataLoader`

Create `src/hooks/useDataLoader.js`:

```js
// src/hooks/useDataLoader.js
import { useState, useEffect } from "react";

export function useDataLoader(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const json = await response.json();
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    loadData();

    return () => {
      ignore = true;
    };
  }, [url]);

  return { data, loading, error };
}
```

Two details to note:

- `url` is in the dependency array. If the URL changes, the effect re-runs and the previous in-flight request is abandoned via `ignore`.
- The hook returns `{ data, loading, error }`, three pieces of state that always travel together.

### Update `DataPanel`

Add the import at the top of `App.jsx`:

```jsx
// src/App.jsx
import { useDataLoader } from "./hooks/useDataLoader";
```

Then replace the inline fetch logic:

```jsx
// src/App.jsx
// Before — 21 lines of boilerplate
function DataPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadContacts = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3001/contacts");
        const json = await response.json();
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    loadContacts();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading)
    return (
      <div className="panel">
        <h2>Data</h2>
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="panel">
        <h2>Data</h2>
        <p className="error">Error: {error}</p>
      </div>
    );

  return (
    <div className="panel">
      <h2>Data</h2>
      <ul className="result-list">
        {data.map((contact) => (
          <li key={contact.id}>
            {contact.name} — {contact.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```jsx
// src/App.jsx
// After — one line of state, then rendering
function DataPanel() {
  const { data, loading, error } = useDataLoader(
    "http://localhost:3001/contacts",
  );

  if (loading)
    return (
      <div className="panel">
        <h2>Data</h2>
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="panel">
        <h2>Data</h2>
        <p className="error">Error: {error}</p>
      </div>
    );

  return (
    <div className="panel">
      <h2>Data</h2>
      <ul className="result-list">
        {data.map((contact) => (
          <li key={contact.id}>
            {contact.name} — {contact.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

The cleanup is now automatic. Every caller of `useDataLoader` gets the `ignore` flag behaviour without knowing it exists. A developer cannot forget it because there is nothing to write.

You can also tidy up the React import, `useEffect` is no longer used directly in `App.jsx`.

---

### Activity (Optional): Add a Tags Data Panel (10 minutes)

`useDataLoader` can load any URL. Add a panel that loads tags from json-server.

**Task:** Add a `TagsDataPanel` component that:

1. Uses `useDataLoader('http://localhost:3001/tags')` to fetch the tags list
2. Shows a loading state while the request is in flight
3. Shows an error message if the request fails
4. Renders each tag's `label` field in a list

Add `<TagsDataPanel />` to the `.panels` grid in `AppContent`.

**Hints:**

1. The structure is identical to `DataPanel`, only the URL and field names change
2. The `tags` records have `id` and `label` fields (see `db.json`)
3. Use `tag.id` as the key and `tag.label` as the display text

<details>
<summary>Reference solution</summary>

```jsx
// src/App.jsx
function TagsDataPanel() {
  const { data, loading, error } = useDataLoader("http://localhost:3001/tags");

  if (loading)
    return (
      <div className="panel">
        <h2>Tags (API)</h2>
        <p>Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="panel">
        <h2>Tags (API)</h2>
        <p className="error">Error: {error}</p>
      </div>
    );

  return (
    <div className="panel">
      <h2>Tags (API)</h2>
      <ul className="result-list">
        {data.map((tag) => (
          <li key={tag.id}>{tag.label}</li>
        ))}
      </ul>
    </div>
  );
}
```

Both `DataPanel` and `TagsDataPanel` use `useDataLoader`. Each gets its own independent `data`, `loading`, and `error` state. The cleanup behaviour is present in both without any additional effort.

</details>

---

## Brief Overview: TanStack Query

> This section is conceptual, no code changes are needed.

The three hooks you built today solve real problems, but they stop short of what production applications need:

- `useDataLoader` re-fetches from the server every time the component mounts, even if the data has not changed
- There is no caching: if two components load the same URL, two separate network requests are made
- There is no background refetching: data shown to the user can become stale while the tab is open

**[TanStack Query](https://tanstack.com/query/latest)** (the `@tanstack/react-query` package, formerly known as React Query) solves all of these. Instead of writing `useDataLoader`, you write:

```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ["contacts"],
  queryFn: async () => {
    const response = await fetch("http://localhost:3001/contacts");
    return response.json();
  },
});
```

The mental model is almost identical to `useDataLoader`. The differences are what TanStack Query adds on top:

| Capability                | `useDataLoader`   | TanStack Query |
| ------------------------- | ----------------- | -------------- |
| Fetch on mount            | Yes               | Yes            |
| Cleanup on unmount        | Yes (we added it) | Yes            |
| Cache across components   | No                | Yes            |
| Background refetch        | No                | Yes            |
| Deduplication of requests | No                | Yes            |
| Retry on failure          | No                | Configurable   |

What each of these means in practice:

- **Cache across components.** `useDataLoader('http://localhost:3001/contacts')` fetches fresh data every time a new component calls it, even if another component on the same page already fetched the same URL a second ago. TanStack Query keys its cache by `queryKey`, so a second component calling `useQuery({ queryKey: ['contacts'], ... })` reads the existing cached result immediately instead of firing a new request.
- **Background refetch.** With `useDataLoader`, once data has loaded, it stays on screen exactly as it was fetched, even if the user leaves the browser tab open for an hour and the underlying data changes on the server. TanStack Query can automatically refetch in the background, for example when the browser tab regains focus or the network reconnects, and swap in the new data without the user having to reload the page.
- **Deduplication of requests.** If three components mount at the same time and all call `useDataLoader` with the same URL, three separate `fetch` calls go out. TanStack Query recognises that three `useQuery` calls share the same `queryKey` within a short window and merges them into a single network request, sharing the one response across all three.
- **Retry on failure.** `useDataLoader` calls `setError` once and stops on the first failed request; the caller has to build its own retry logic. TanStack Query can automatically retry a failed request a configurable number of times, with a configurable delay between attempts, before it gives up and reports an error.

TanStack Query does not replace the skills you practised today. Understanding `useEffect`, dependency arrays, and how a custom hook wraps them is what allows you to use TanStack Query effectively, and debug it when something does not behave as expected. See the [TanStack Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview) to learn more.

---

## Common Pitfalls

**Naming a custom hook without the `use` prefix**

```js
// Wrong — React cannot enforce hook rules on this function
function authContext() {
  return useContext(AuthContext);
}

// Correct — the 'use' prefix signals to React and linters that this is a hook
function useAuth() {
  return useContext(AuthContext);
}
```

**Assuming the hook shares state between callers**

```jsx
// Each component gets its own independent debouncedValue state
function SearchPanel() {
  const debouncedQuery = useDebounce(query); // own isolated state
}

function TagSearchPanel() {
  const debouncedQuery = useDebounce(query); // own isolated state
}
// Typing in one panel does not affect the other
```

**Calling a hook conditionally**

```jsx
// Wrong — hooks must be called unconditionally in the same order on every render
function DataPanel({ enabled }) {
  if (!enabled) return null;
  const { data } = useDataLoader(url); // called after an early return: violates rules of hooks
}

// Correct — call the hook first, then decide what to render
function DataPanel({ enabled }) {
  const { data } = useDataLoader(url);
  if (!enabled) return null;
  // ...
}
```

---

## Summary

| Hook            | What it encapsulates                     | Key benefit                                                      |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `useAuth`       | `useContext(AuthContext)`                | Single import, error guard, hides context details from consumers |
| `useDebounce`   | `useState` + `useEffect` timeout pattern | Reusable across any input; timing logic written once             |
| `useDataLoader` | Async `fetch`, loading, and error state   | Reusable across any URL; fetch logic written once                |

Custom hooks follow a consistent pattern: they extract repeated or complex stateful logic from component bodies so that each component reads as a clear statement of what it needs, not how it works.

---

## Additional Resources

- [Reusing Logic with Custom Hooks — React documentation](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [useHooks — collection of production-ready custom hooks](https://usehooks.com/)
- [TanStack Query — Getting Started](https://tanstack.com/query/latest/docs/framework/react/overview)
