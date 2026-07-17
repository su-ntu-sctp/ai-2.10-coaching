# Coaching Session 2.10: Guarding the Guess Game with React Router and AuthContext

## Overview

- **Duration:** ~2.5 hours (~2 hours activity, 30 min debrief)
- **Prerequisites:** Coaching 2.7 (useReducer and useContext), Lesson 2.8 (React Router)

## Session Objectives

By the end of this session, you will be able to:

1. **Add** React Router to an existing single-page app, splitting it into a public route and a protected route
2. **Create** an `AuthContext` that manages a logged-in user separately from the game's own state
3. **Implement** a `ProtectedRoute` component that redirects unauthenticated visitors to a login page

## Introduction

In Coaching 2.7, you refactored the Guess Game so that its state lived in a `useReducer`, shared across components through a `GameContext`. The game itself, however, is still one single screen: open the app and you are already playing.

This session adds a login gate in front of it. You will bring in React Router from Lesson 2.8 to give the app two routes: a public `/login` page, and a `/game` route that only a signed-in visitor can reach. The pattern is `AuthContext` plus `ProtectedRoute`, the same pattern you used to gate the CRM's `/app` routes, applied here to a smaller, already-familiar codebase so you can focus on the routing and auth mechanics rather than relearning the app.

`AuthContext` and `GameContext` stay separate. `AuthContext` only ever answers "who is logged in?" `GameContext` only ever answers "what is the state of the current game?" Keeping them apart means the login system does not need to know anything about secret numbers or scores, and the game does not need to know anything about passwords.

---

## Part 1: Activity (~2 hours)

### Starting Point

Use the `guess-game` project provided alongside this lesson. It is the finished result of Coaching 2.7: game state lives in a reducer inside `GameContext`, and every component reads `state` and `dispatch` with `useContext(GameContext)`.

```
src/
├── components/
│   ├── GameStatus.jsx
│   ├── GuessInput.jsx
│   ├── GuessItem.jsx
│   └── GuessList.jsx
├── contexts/
│   └── GameContext.jsx
├── reducers/
│   └── gameReducer.js
├── App.jsx
└── main.jsx
```

There is currently no routing, and no concept of a logged-in user. `App.jsx` renders the game directly.

### Install React Router

```bash
npm install react-router@7
```

---

### Part 1A: Create AuthContext

Before any routing exists, the app needs somewhere to keep track of who is logged in. This is a second context, entirely separate from `GameContext`.

#### Task

Create `src/contexts/AuthContext.jsx`. It should expose a `user` value (`null` when signed out), plus `login` and `logout` functions. Use a small hardcoded list of valid credentials rather than a real backend, the same approach `AuthContext` used in Lesson 2.8.

#### Hints

1. `createContext(null)` is the default value; the actual value comes from the provider.
2. `user` can start as `null` and be set with `useState`.
3. `login` should check a username and password against a hardcoded list and return `true` or `false` so the login form knows whether to show an error.
4. `logout` just needs to set `user` back to `null`.

<details>
<summary>Reference solution</summary>

Create `src/contexts/AuthContext.jsx`:

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const VALID_USERS = [
  { username: "player1", password: "password123", name: "Alex" },
  { username: "player2", password: "password123", name: "Sam" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    const match = VALID_USERS.find(
      (u) => u.username === username && u.password === password,
    );
    if (!match) return false;
    setUser({ username: match.username, name: match.name });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

</details>

**Check:** No visible change yet, `AuthContext` is not wired into the app. This part only creates the context and provider.

---

### Part 1B: Add Routing with a Public Login Page

Now that `AuthContext` exists, wrap the app with both providers and introduce two routes: a public `/login` page, and `/game`, which will be protected in Part 1C.

#### Task

1. Wrap `App` with `AuthProvider` and `BrowserRouter` in `main.jsx`.
2. Create `src/pages/LoginPage.jsx` with a username and password form that calls `login` from `AuthContext`.
3. Update `src/App.jsx` to declare two routes: `path="login"` renders `LoginPage`, and `path="game"` renders the existing game UI.
4. After a successful login, navigate to `/game`.

#### Hints

1. `GameProvider` only needs to wrap the `/game` route's content, not the whole app, `LoginPage` does not need game state.
2. `useNavigate` gives you a function to call after the form submits; it is not the same thing as the `<Navigate>` component you will use in Part 1C.
3. Move the JSX currently in `App.jsx` (`GameStatus`, `GuessInput`, `GuessList`, the heading, the reset button) into its own `GamePage` component.
4. Give `LoginPage` a visible hint of valid credentials, the same way the CRM's login page did in Lesson 2.8, so testing the route is easy.

<details>
<summary>Reference solution</summary>

Update `src/main.jsx`:

```jsx
// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

Create `src/pages/LoginPage.jsx`:

```jsx
// src/pages/LoginPage.jsx
import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router";

import { AuthContext } from "../contexts/AuthContext";
import styles from "./LoginPage.module.css";

function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submitHandler = (e) => {
    e.preventDefault();
    const ok = login(username, password);
    if (!ok) {
      setError("Incorrect username or password.");
      return;
    }
    const from = location.state?.from?.pathname || "/game";
    navigate(from, { replace: true });
  };

  return (
    <div className={styles.page}>
      <h1>Sign in to play</h1>
      <form onSubmit={submitHandler}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Log in</button>
        {error && <p className={styles.error}>{error}</p>}
      </form>
      <p className={styles.hint}>Try: player1 / password123</p>
    </div>
  );
}

export default LoginPage;
```

Create `src/pages/LoginPage.module.css`:

```css
/* src/pages/LoginPage.module.css */
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
}

.error {
  color: #c53030;
}

.hint {
  color: #718096;
  font-size: 0.9rem;
}
```

Create `src/pages/GamePage.jsx`, moving the game UI out of `App.jsx`:

```jsx
// src/pages/GamePage.jsx
import { useContext } from "react";

import GameStatus from "../components/GameStatus";
import GuessInput from "../components/GuessInput";
import GuessList from "../components/GuessList";
import { GameContext } from "../contexts/GameContext";
import styles from "../App.module.css";

function GamePage() {
  const { state, dispatch } = useContext(GameContext);

  const resetHandler = () => {
    dispatch({ type: "NEW_GAME" });
  };

  return (
    <div className={styles.game}>
      <h1>Guess the Number</h1>
      <p>I am thinking of a number between 1 and 20.</p>
      <p>Score: {state.score}</p>

      <GameStatus />
      <GuessInput />
      {state.status !== "playing" && (
        <button
          type="button"
          className={styles.resetButton}
          onClick={resetHandler}
        >
          New Game
        </button>
      )}
      <GuessList />
    </div>
  );
}

export default GamePage;
```

Update `src/App.jsx`:

```jsx
// src/App.jsx
import { Routes, Route } from "react-router";

import { GameProvider } from "./contexts/GameContext";
import LoginPage from "./pages/LoginPage";
import GamePage from "./pages/GamePage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/game"
        element={
          <GameProvider>
            <GamePage />
          </GameProvider>
        }
      />
    </Routes>
  );
}

export default App;
```

</details>

**Check:** Navigate to `http://localhost:5173/login` and log in with `player1 / password123`. You should land on `/game` and the game should behave exactly as it did in Coaching 2.7. Navigating directly to `/game` without logging in should also work for now, that gap is closed in the next part.

---

### Part 1C: Lock /game Behind ProtectedRoute

Right now, anyone can type `/game` into the address bar and play without logging in. `ProtectedRoute` closes this gap in one place, rather than checking `user` inside `GamePage` itself.

#### Task

1. Create `src/components/ProtectedRoute.jsx`. It should read `user` from `AuthContext`, redirect to `/login` if `user` is `null`, and otherwise render `<Outlet />`.
2. Nest the `/game` route inside `ProtectedRoute` in `App.jsx`.
3. Add a redirect-back: after logging in, the visitor should land on whichever page they originally tried to reach.
4. Add a root redirect: visiting `/` should send the visitor to `/game` (which then redirects to `/login` if they are not signed in).

#### Hints

1. `Navigate` is a component you return from render, not a function you call, that is `useNavigate`, which you already used in `LoginPage`.
2. Pass the current location to `<Navigate>` as `state={{ from: location }}` so `LoginPage` knows where to send the visitor back to.
3. `useLocation` gives you the current location object; you will need it inside `ProtectedRoute` to build that `state`.
4. A `<Route element={<ProtectedRoute />}>` with no `path` wraps its children without adding a URL segment, exactly like the CRM's `/app` guard in Lesson 2.8.

<details>
<summary>Reference solution</summary>

Create `src/components/ProtectedRoute.jsx`:

```jsx
// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { AuthContext } from "../contexts/AuthContext";

function ProtectedRoute() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
```

Update `src/App.jsx`:

```jsx
// src/App.jsx
import { Routes, Route, Navigate } from "react-router";

import { GameProvider } from "./contexts/GameContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import GamePage from "./pages/GamePage";

function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/game" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/game"
          element={
            <GameProvider>
              <GamePage />
            </GameProvider>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
```

</details>

**Check:** Log out (add a temporary logout button to `GamePage` if you have not already, or clear state by refreshing after calling `logout` from the console) and try navigating directly to `/game`. You should be redirected to `/login`. After logging back in, you should land on `/game`, not somewhere else. Visiting `/` while signed out should also end up at `/login`.

> **Why does `state.status` reset when you follow a redirect back to `/game`?** `GameProvider` wraps the `/game` route's `element`, so every time React Router mounts that route, `GameProvider` mounts fresh and calls `getInitialState()` again. This is expected: a new sign-in starts a new game.

---

### Part 1D: Add a Logout Button

`GamePage` currently has no way to sign out. Add one, reading `logout` from `AuthContext`.

#### Task

Add a "Log out" button to `GamePage` that calls `logout` from `AuthContext` and returns the visitor to `/login`.

#### Hints

1. `GamePage` already imports `useContext` for `GameContext`; you will need a second `useContext` call for `AuthContext`.
2. `logout()` alone does not navigate anywhere, `AuthContext`'s `user` becoming `null` will cause `ProtectedRoute` to redirect the next time `/game` is visited, but you are already on `/game` when the button is clicked. Call `useNavigate` and navigate to `/login` explicitly after calling `logout()`.

<details>
<summary>Reference solution</summary>

Update `src/pages/GamePage.jsx`:

```jsx
// src/pages/GamePage.jsx
import { useContext } from "react";
import { useNavigate } from "react-router";

import GameStatus from "../components/GameStatus";
import GuessInput from "../components/GuessInput";
import GuessList from "../components/GuessList";
import { GameContext } from "../contexts/GameContext";
import { AuthContext } from "../contexts/AuthContext";
import styles from "../App.module.css";

function GamePage() {
  const { state, dispatch } = useContext(GameContext);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const resetHandler = () => {
    dispatch({ type: "NEW_GAME" });
  };

  const logoutHandler = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={styles.game}>
      <h1>Guess the Number</h1>
      <p>Signed in as {user.name}</p>
      <p>I am thinking of a number between 1 and 20.</p>
      <p>Score: {state.score}</p>

      <GameStatus />
      <GuessInput />
      {state.status !== "playing" && (
        <button
          type="button"
          className={styles.resetButton}
          onClick={resetHandler}
        >
          New Game
        </button>
      )}
      <GuessList />

      <button type="button" className={styles.resetButton} onClick={logoutHandler}>
        Log out
      </button>
    </div>
  );
}

export default GamePage;
```

</details>

**Check:** Clicking "Log out" should return you to `/login`. Trying to navigate back to `/game` afterward (including with the browser Back button) should redirect you to `/login` again, not show stale game state.

---

## Part 2: Add a 404 Page

Right now, any URL that does not match `/`, `/login`, or `/game` renders a blank page, `Routes` has nothing to fall back to. Add a catch-all `NotFoundPage`.

### Task

Add a catch-all `NotFoundPage` for any URL that does not match `/`, `/login`, or `/game`. It should render a simple message and a link back to `/`.

### Hints

1. React Router's catch-all path is `*`. Declare it last, outside `ProtectedRoute`, so it is reachable whether or not the visitor is signed in.
2. Use `Link` from `react-router`, not a plain `<a>` tag, so the navigation does not trigger a full page reload.
3. `LoginPage`'s route declaration is your model for adding a new top-level route in `App.jsx`.

<details>
<summary>Reference solution</summary>

Create `src/pages/NotFoundPage.jsx`:

```jsx
// src/pages/NotFoundPage.jsx
import { Link } from "react-router";

import styles from "./NotFoundPage.module.css";

function NotFoundPage() {
  return (
    <div className={styles.page}>
      <h1>404</h1>
      <p>This page does not exist.</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default NotFoundPage;
```

Create `src/pages/NotFoundPage.module.css`:

```css
/* src/pages/NotFoundPage.module.css */
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
}
```

Update `src/App.jsx`, adding the catch-all route last:

```jsx
// src/App.jsx
import { Routes, Route, Navigate } from "react-router";

import { GameProvider } from "./contexts/GameContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import GamePage from "./pages/GamePage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/game" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/game"
          element={
            <GameProvider>
              <GamePage />
            </GameProvider>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
```

</details>

**Check:** Navigate to a URL that does not exist, for example `/nonsense`. You should see the 404 page with a working link back to `/`. This should work whether or not you are signed in.

---

## Part 3: Debrief (30 minutes)

### Learner Presentations

Two volunteers will share their screen and walk through their solution. As you watch, consider:

- How did they split `AuthContext` and `GameContext`, and did the two ever need to know about each other?
- Where did they call `useNavigate` versus return `<Navigate>`, and why?
- What state did they pass through the redirect back to `LoginPage`?

### Instructor Walkthrough

After the presentations, the instructor will walk through the reference solution covering:

1. Why `AuthContext` and `GameContext` are kept as two separate contexts rather than merged into one
2. `ProtectedRoute` as a layout route with no path segment of its own, wrapping `/game`
3. The redirect-back pattern: `<Navigate state={{ from: location }}>` on the way out, `location.state?.from?.pathname` on the way back in
4. Why `GameProvider` wrapping the `/game` route's element means a fresh sign-in always starts a fresh game
5. The difference between `useNavigate` (called inside an event handler) and `<Navigate>` (returned from render)
6. Why the `*` catch-all route must be declared last

---

## Summary

Here is what you practised today:

- **React Router setup**: wrapping an existing single-screen app with `BrowserRouter` and splitting it into named routes
- **AuthContext**: a context dedicated to "who is logged in," kept separate from the app's own state
- **ProtectedRoute**: a layout route that checks authentication before rendering `<Outlet />`, redirecting to `/login` otherwise
- **Redirect-back**: passing the originally requested location through `<Navigate state={{ from }}>` so a visitor lands where they meant to go after signing in
- **Catch-all routing**: a `*` route declared last, reachable regardless of sign-in state, for any URL that matches nothing else

In the next lesson (2.11), you will learn form validation and deployment, taking the CRM from a local project to a live, publicly deployed application.
