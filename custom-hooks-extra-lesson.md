# Lesson 2.10: Custom Hooks

> This is a supplementary lesson, not part of the standard course sequence. It was originally drafted for Lesson 2.10, which has since been restored as a coaching session (see [lesson.md](./lesson.md)). This material is retained here to be covered separately, as an extra lesson.

## Overview

- **Duration:** ~2 hours (hands-on lab)
- **Prerequisites:** Lesson 2.9 — Testing and Performance Optimisation

## Learning Objectives

By the end of this lesson, you will be able to:

1. **Extract** stateful logic from components into custom hooks to separate concerns and enable reuse
2. **Implement** `useDebounce` and `useDataLoader` as general-purpose hooks that solve real problems
3. **Explain** why a missing cleanup function in `useEffect` causes stale data bugs, and how encapsulating the fix in a hook prevents the mistake from recurring

## Introduction

The theme of Lessons 2.9 and 2.10 is: make it correct, make it fast, make it clean. Lesson 2.9 covered correctness (testing) and speed (performance optimisation). This lesson covers the third step: writing code that is easy to read, test, and reuse.

The tool for this is the custom hook. A custom hook is a plain JavaScript function whose name starts with `use`. It can call built-in hooks (`useState`, `useEffect`, `useContext`, and so on) and return whatever values the caller needs. The key insight is that a custom hook does not share state between callers, each component that calls a hook gets its own isolated state. What is shared is the logic.

Rather than adding to the CRM, you will work with a purpose-built app called `hooks-demo`. It has three panels: an authentication panel, a search panel, and a data panel. Each panel is working but messy. Your job is to refactor each one so that the component describes *what* it needs, and the hook takes care of *how*.

---

## Setup: The `hooks-demo` App

### Scaffold the Project

Create a new Vite + React project:

```bash
npm create vite@latest hooks-demo -- --template react
cd hooks-demo
npm install
```

### Install json-server

You will need json-server to serve fake API data in Part 3:

```bash
npm install -D json-server
```

### Add the Database File

Create `db.json` in the project root:

```json
// db.json
{
  "contacts": [
    { "id": 1, "name": "Alice Tan", "email": "alice@example.com", "role": "admin" },
    { "id": 2, "name": "Bob Lim", "email": "bob@example.com", "role": "user" },
    { "id": 3, "name": "Carol Wong", "email": "carol@example.com", "role": "user" },
    { "id": 4, "name": "David Chen", "email": "david@example.com", "role": "admin" },
    { "id": 5, "name": "Eve Ng", "email": "eve@example.com", "role": "user" },
    { "id": 6, "name": "Frank Ho", "email": "frank@example.com", "role": "user" }
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
    "server": "json-server --watch db.json --port 3001"
  }
}
```

### Add the Stylesheet

Replace the entire contents of `src/App.css` with the following:

```css
/* src/App.css */
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: sans-serif;
  margin: 0;
  background: #f8fafc;
  color: #1a202c;
}

.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.app h1 {
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.panel h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-panel p { margin: 0.5rem 0; font-size: 0.95rem; }

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

button {
  padding: 0.4rem 0.9rem;
  background: #3182ce;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

button:hover { background: #2b6cb0; }

button.secondary {
  background: #e2e8f0;
  color: #4a5568;
  margin-left: 0.5rem;
}

button.secondary:hover { background: #cbd5e0; }

.search-box { margin-bottom: 0.75rem; }

.result-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result-list li {
  padding: 0.3rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f0f0;
}

.result-list li:last-child { border-bottom: none; }

.status {
  font-size: 0.85rem;
  color: #718096;
  margin-top: 0.5rem;
}

.error { color: #c53030; font-size: 0.9rem; }
```

### Create the Context and Provider

Create `src/contexts/AuthContext.jsx`:

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useState } from 'react';

export const AuthContext = createContext(null);

const FAKE_USERS = {
  admin: { name: 'Alice Tan', role: 'admin' },
  user: { name: 'Bob Lim', role: 'user' },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  function login(username, password) {
    if (password !== 'password') return false;
    const user = FAKE_USERS[username];
    if (!user) return false;
    setCurrentUser(user);
    return true;
  }

  function logout() {
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

This is a simple fake auth system. The only valid password is `"password"`, and the two valid usernames are `"admin"` and `"user"`.

### Create the Starter App Shell

Replace `src/App.jsx` with the following. This is the *messy* starting point, all logic is inline. You will refactor it progressively through the lesson:

```jsx
// src/App.jsx
import './App.css';
import { useContext, useState, useEffect } from 'react';
import { AuthContext, AuthProvider } from './contexts/AuthContext';

// ─── Auth Panel (messy: reads context directly, no encapsulation) ──────────────
function AuthPanel() {
  const { currentUser, login, logout } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    const ok = login(username, password);
    if (!ok) setError('Invalid username or password.');
    else setError('');
  }

  if (currentUser) {
    return (
      <div className="panel auth-panel">
        <h2>Auth</h2>
        <p>Logged in as <strong>{currentUser.name}</strong></p>
        <p>Role: <strong>{currentUser.role}</strong></p>
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
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Log in</button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="status">Try: admin / password</p>
    </div>
  );
}

// ─── Search Panel (messy: debounce logic inline) ───────────────────────────────
const CONTACTS = [
  'Alice Tan', 'Bob Lim', 'Carol Wong', 'David Chen', 'Eve Ng', 'Frank Ho',
];

function SearchPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = CONTACTS.filter(name =>
    name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <div className="panel">
      <h2>Search</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search contacts..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <ul className="result-list">
        {results.map(name => <li key={name}>{name}</li>)}
      </ul>
      <p className="status">{results.length} result{results.length !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ─── Data Panel (messy: fetch logic inline, cleanup bug present) ───────────────
function DataPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3001/contacts')
      .then(r => r.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="panel"><h2>Data</h2><p>Loading...</p></div>;
  if (error) return <div className="panel"><h2>Data</h2><p className="error">Error: {error}</p></div>;

  return (
    <div className="panel">
      <h2>Data</h2>
      <ul className="result-list">
        {data.map(contact => (
          <li key={contact.id}>{contact.name} — {contact.role}</li>
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

If you rename `AuthContext`, add a guard, or change the shape of the context value, you must update every consumer. There is also no protection against calling `useContext(AuthContext)` outside the `<AuthProvider>`, you receive `null` back with no explanation.

A custom hook fixes all of this.

### Create `useAuth`

Create the folder and file:

```bash
mkdir -p src/hooks
```

Create `src/hooks/useAuth.js`:

```js
// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
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
import { useContext, useState, useEffect } from 'react';
import { AuthContext, AuthProvider } from './contexts/AuthContext';

function AuthPanel() {
  const { currentUser, login, logout } = useContext(AuthContext);
  // ...
}
```

```jsx
// src/App.jsx
// After — one hook import, no mention of AuthContext
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

function AuthPanel() {
  const { currentUser, login, logout } = useAuth();
  // ...
}
```

The rest of `AuthPanel` is unchanged. Test by logging in and out, behaviour should be identical.

> **What the hook does not change**
>
> `useAuth` does not add new functionality and does not create new state. Each component that calls `useAuth()` reads the same context value from the same `<AuthProvider>`. The hook is purely an encapsulation, it hides *where* the value comes from so that consuming components only need to know *what* they get back.

### Verify the Error Guard

Temporarily add `<AuthPanel />` directly inside `App` outside the `<AuthProvider>` and reload the page. You should see a clear error: `"useAuth must be used inside <AuthProvider>"`. Remove the temporary change before continuing.

This guard would be impossible to write without the custom hook, callers using `useContext` directly would receive `null` silently.

---

## Part 2: `useDebounce` — Derived State with a Delay (30 minutes)

### The Problem

Look at `SearchPanel` in `App.jsx`. The debounce logic takes up seven lines:

```jsx
// src/App.jsx
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query);
  }, 300);
  return () => clearTimeout(timer);
}, [query]);
```

This pattern is correct, but it is entangled with `SearchPanel`'s other responsibilities. If a second component ever needs debouncing, a tag search, a live-filter input, you would duplicate these seven lines.

A custom hook extracts the pattern so any component can write:

```jsx
const debouncedQuery = useDebounce(query, 300);
```

### How Debouncing Works

Every time `query` changes (on each keystroke), the `useEffect` runs. It sets a 300ms timer. If `query` changes again before the timer fires, the user keeps typing, the cleanup function cancels the old timer and a new one starts. The `debouncedQuery` state only updates after the user pauses for 300ms.

The result: the filtered list does not update on every keystroke, only when the user stops typing. For a search that calls an API, this prevents a network request on every character.

### Create `useDebounce`

Create `src/hooks/useDebounce.js`:

```js
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

The hook accepts any `value` and a `delay` in milliseconds. It maintains its own `debouncedValue` state, schedules an update after `delay` ms, and cancels the previous timer if `value` changes before the delay elapses.

### Update `SearchPanel`

Add the import at the top of `App.jsx`:

```jsx
// src/App.jsx
import { useDebounce } from './hooks/useDebounce';
```

Then simplify `SearchPanel`:

```jsx
// src/App.jsx
// Before — seven lines of timing logic inside the component
function SearchPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = CONTACTS.filter(name =>
    name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );
  // ...
}
```

```jsx
// src/App.jsx
// After — intent is clear, mechanism is hidden
function SearchPanel() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const results = CONTACTS.filter(name =>
    name.toLowerCase().includes(debouncedQuery.toLowerCase())
  );
  // ...
}
```

You can also remove `useEffect` from the React import line if it is no longer used elsewhere in `App.jsx`.

The component now reads as a clear statement of intent: "I have a query. Its debounced version is derived by the hook. I filter contacts by the debounced version."

> **Each caller gets its own state**
>
> If two components both call `useDebounce(query, 300)`, each gets its own independent `debouncedValue` state. Calling a hook is like calling a function, the state lives inside the component instance that called it, not inside the hook file. What is shared is the logic, not the data.

---

### Activity: Add a Tag Search Panel (10 minutes)

Now that `useDebounce` exists, add a second search panel for the tag list without writing the debounce logic again.

**Task:** Add a `TagSearchPanel` component to `App.jsx` and display it as a fourth panel. The panel should:

1. Show a search input
2. Filter the `TAGS` list by the typed value, debounced by 300ms
3. Display the matching tags as a list

Add this constant near the top of `App.jsx`, alongside `CONTACTS`:

```js
// src/App.jsx
const TAGS = ['React', 'TypeScript', 'Testing', 'Performance', 'Custom Hooks', 'React Query'];
```

**Hints:**

1. Copy the structure of `SearchPanel`, the tag panel is nearly identical
2. Call `useDebounce(query, 300)` the same way; the hook works for any string value
3. Filter `TAGS` with `.toLowerCase().includes(...)` the same way contacts are filtered
4. Add `<TagSearchPanel />` to the `.panels` div in `AppContent`

<details>
<summary>Reference solution</summary>

```jsx
// src/App.jsx
const TAGS = ['React', 'TypeScript', 'Testing', 'Performance', 'Custom Hooks', 'React Query'];

function TagSearchPanel() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const results = TAGS.filter(tag =>
    tag.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <div className="panel">
      <h2>Tags</h2>
      <div className="search-box">
        <input
          type="text"
          placeholder="Search tags..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <ul className="result-list">
        {results.map(tag => <li key={tag}>{tag}</li>)}
      </ul>
      <p className="status">{results.length} result{results.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
```

Add `<TagSearchPanel />` inside the `.panels` div in `AppContent`. The `useDebounce` hook is imported once and used by both panels, each with its own independent state.

</details>

---

## Part 3: `useDataLoader` — Async Fetch with Cleanup (40 minutes)

### The Problem

Look at `DataPanel` in `App.jsx`. It fetches data inside a `useEffect`. The code looks correct, but it has a silent bug:

```jsx
// src/App.jsx
useEffect(() => {
  setLoading(true);
  fetch('http://localhost:3001/contacts')
    .then(r => r.json())
    .then(json => {
      setData(json);      // ← called even if the component has unmounted
      setLoading(false);  // ← same
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
}, []);
```

The `useEffect` starts a network request. If the component unmounts before the request finishes, for example, the user navigates away, the `.then()` callback still runs and calls `setData` on a component that no longer exists. In a fast network this is harmless. On a slow network, or when the URL can change (if `url` were a dependency), this causes stale data: a slow earlier request resolves after a fast later one, overwriting the correct result with outdated data.

### Demonstrate the Bug

To see the scenario, update `DataPanel`'s `useEffect` to simulate a slow fetch:

```jsx
// src/App.jsx
useEffect(() => {
  setLoading(true);
  setTimeout(() => {
    fetch('http://localhost:3001/contacts')
      .then(r => r.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, 3000);
}, []);
```

Make `DataPanel` conditionally renderable. Update `AppContent` with a toggle button:

```jsx
// src/App.jsx
function AppContent() {
  const [showData, setShowData] = useState(true);

  return (
    <div className="app">
      <h1>hooks-demo</h1>
      <button onClick={() => setShowData(s => !s)} className="secondary">
        Toggle Data Panel
      </button>
      <div className="panels">
        <AuthPanel />
        <SearchPanel />
        {showData && <DataPanel />}
      </div>
    </div>
  );
}
```

Reload the page. Click Toggle to hide the panel while the 3-second delay is running. After 3 seconds, check the browser console, you will see the React warning: `"Warning: Can't perform a React state update on an unmounted component"`.

Remove the `setTimeout` wrapper before continuing. The real fix is next.

### Fix the Bug with a Cleanup Flag

The standard fix uses an `ignore` flag. Update `DataPanel`'s `useEffect`:

```jsx
// src/App.jsx
useEffect(() => {
  let ignore = false;
  setLoading(true);
  fetch('http://localhost:3001/contacts')
    .then(r => r.json())
    .then(json => {
      if (!ignore) {
        setData(json);
        setLoading(false);
      }
    })
    .catch(err => {
      if (!ignore) {
        setError(err.message);
        setLoading(false);
      }
    });
  return () => {
    ignore = true;
  };
}, []);
```

The cleanup function `() => { ignore = true; }` runs when the component unmounts, or when the dependency array value changes. After that, the `.then()` callback checks `ignore` before calling `setState` and skips the update if the component is no longer mounted.

> **Why `ignore` and not `AbortController`?**
>
> `AbortController` cancels the in-flight network request, which is more efficient. The `ignore` flag is simpler to read and teach. Both are correct. `AbortController` is the production preference; `ignore` is a valid first step and the easier concept to reason about.

### Extract the Fix into `useDataLoader`

The `ignore` flag pattern is correct, but it must now be written every time data is fetched. If a developer forgets it in one place, the bug comes back. Extracting it into a hook makes the fix automatic for every caller.

Create `src/hooks/useDataLoader.js`:

```js
// src/hooks/useDataLoader.js
import { useState, useEffect } from 'react';

export function useDataLoader(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then(json => {
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

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
import { useDataLoader } from './hooks/useDataLoader';
```

Then replace the inline fetch logic:

```jsx
// src/App.jsx
// Before — 18 lines of boilerplate
function DataPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch('http://localhost:3001/contacts')
      .then(r => r.json())
      .then(json => { if (!ignore) { setData(json); setLoading(false); } })
      .catch(err => { if (!ignore) { setError(err.message); setLoading(false); } });
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="panel"><h2>Data</h2><p>Loading...</p></div>;
  if (error) return <div className="panel"><h2>Data</h2><p className="error">Error: {error}</p></div>;

  return (
    <div className="panel">
      <h2>Data</h2>
      <ul className="result-list">
        {data.map(contact => <li key={contact.id}>{contact.name} — {contact.role}</li>)}
      </ul>
    </div>
  );
}
```

```jsx
// src/App.jsx
// After — one line of state, then rendering
function DataPanel() {
  const { data, loading, error } = useDataLoader('http://localhost:3001/contacts');

  if (loading) return <div className="panel"><h2>Data</h2><p>Loading...</p></div>;
  if (error) return <div className="panel"><h2>Data</h2><p className="error">Error: {error}</p></div>;

  return (
    <div className="panel">
      <h2>Data</h2>
      <ul className="result-list">
        {data.map(contact => (
          <li key={contact.id}>{contact.name} — {contact.role}</li>
        ))}
      </ul>
    </div>
  );
}
```

The cleanup is now automatic. Every caller of `useDataLoader` gets the `ignore` flag behaviour without knowing it exists. A developer cannot forget it because there is nothing to write.

You can also tidy up the React import, `useEffect` is no longer used directly in `App.jsx`.

---

### Activity: Add a Tags Data Panel (10 minutes)

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
  const { data, loading, error } = useDataLoader('http://localhost:3001/tags');

  if (loading) return <div className="panel"><h2>Tags (API)</h2><p>Loading...</p></div>;
  if (error) return <div className="panel"><h2>Tags (API)</h2><p className="error">Error: {error}</p></div>;

  return (
    <div className="panel">
      <h2>Tags (API)</h2>
      <ul className="result-list">
        {data.map(tag => (
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

## Brief Overview: React Query

> This section is conceptual, no code changes are needed.

The three hooks you built today solve real problems, but they stop short of what production applications need:

- `useDataLoader` re-fetches from the server every time the component mounts, even if the data has not changed
- There is no caching: if two components load the same URL, two separate network requests are made
- There is no background refetching: data shown to the user can become stale while the tab is open

**React Query** (the `@tanstack/react-query` package) solves all of these. Instead of writing `useDataLoader`, you write:

```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['contacts'],
  queryFn: () => fetch('http://localhost:3001/contacts').then(r => r.json()),
});
```

The mental model is almost identical to `useDataLoader`. The differences are what React Query adds on top:

| Capability | `useDataLoader` | React Query |
|---|---|---|
| Fetch on mount | Yes | Yes |
| Cleanup on unmount | Yes (we added it) | Yes |
| Cache across components | No | Yes |
| Background refetch | No | Yes |
| Deduplication of requests | No | Yes |
| Retry on failure | No | Configurable |

React Query does not replace the skills you practised today. Understanding `useEffect`, the `ignore` flag, and the cleanup pattern is what allows you to use React Query effectively, and debug it when something does not behave as expected.

---

## Bonus Challenges

These challenges have no provided solution. They are for learners who finish the lab early.

1. Add a `refetch` function to `useDataLoader`. The caller should be able to call `refetch()` to re-run the fetch without changing the URL. One approach: maintain an internal counter in the dependency array and increment it on `refetch`.
2. Add an `enabled` option to `useDataLoader`. When `enabled` is `false`, the effect should not run at all. This is useful for lazy loading, fetch only when a condition is met.
3. Extend `useAuth` to persist the logged-in user to `localStorage`. On mount, read from `localStorage` to restore a previous session. On logout, clear the stored value.
4. Extend `useDebounce` to accept a third argument, `immediate`. When `immediate` is `true`, the value should update on the first change immediately and debounce only subsequent rapid changes (leading-edge debounce).

---

## Common Pitfalls

**Forgetting to return the cleanup function from `useDataLoader`**

```js
// Wrong — ignore is set to true immediately, not on unmount
useEffect(() => {
  let ignore = false;
  fetch(url).then(data => { if (!ignore) setData(data); });
  ignore = true;
}, [url]);

// Correct — the cleanup function runs when the component unmounts
useEffect(() => {
  let ignore = false;
  fetch(url).then(data => { if (!ignore) setData(data); });
  return () => { ignore = true; };
}, [url]);
```

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
  const debouncedQuery = useDebounce(query, 300); // own isolated state
}

function TagSearchPanel() {
  const debouncedQuery = useDebounce(query, 300); // own isolated state
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

| Hook | What it encapsulates | Key benefit |
|---|---|---|
| `useAuth` | `useContext(AuthContext)` | Single import, error guard, hides context details from consumers |
| `useDebounce` | `useState` + `useEffect` timeout pattern | Reusable across any input; timing logic written once |
| `useDataLoader` | Async `fetch` with `ignore` flag cleanup | Correct behaviour is automatic; impossible to forget the cleanup |

Custom hooks follow a consistent pattern: they extract repeated or complex stateful logic from component bodies so that each component reads as a clear statement of what it needs, not how it works.

---

## Additional Resources

- [Reusing Logic with Custom Hooks — React documentation](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [useHooks — collection of production-ready custom hooks](https://usehooks.com/)
- [TanStack Query (React Query) — Getting Started](https://tanstack.com/query/latest/docs/framework/react/overview)
