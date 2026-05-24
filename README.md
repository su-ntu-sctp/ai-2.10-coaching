# 2.10 Custom Hooks

## Lesson Overview

This lesson completes the "correct, fast, clean" arc from Lesson 2.9 by teaching learners how to extract stateful logic from component bodies into custom hooks. Rather than adding to the CRM, learners work with a purpose-built `hooks-demo` app that has three panels in a deliberately messy starting state: an authentication panel that reads from React Context directly, a search panel with debounce logic written inline, and a data panel with an async fetch that contains a subtle stale-data bug. Learners refactor each panel in sequence — first building `useAuth` to encapsulate context access with an error guard, then `useDebounce` to extract the timing pattern so it can be reused without duplication, and finally `useDataLoader` to fix the stale-data bug by adding an `ignore` flag cleanup and then pulling the entire fetch pattern into a single reusable hook. The lesson closes with a brief conceptual overview of React Query, explaining how it extends the mental model learners built with `useDataLoader`.

## Dependencies

- [Lesson](./lesson.md)

## Lesson Objectives

- Extract stateful logic from components into custom hooks to separate concerns and enable reuse
- Implement `useDebounce` and `useDataLoader` as general-purpose hooks that solve real problems
- Explain why a missing cleanup function in `useEffect` causes stale data bugs, and how encapsulating the fix in a hook prevents the mistake from recurring

## Lesson Plan

| Duration | What | How or Why |
|---|---|---|
| 30 min | Lecture | Slides: the correct/fast/clean arc, what a custom hook is, rules of hooks recap, preview of the three patterns, when to reach for a hook |
| 20 min | Setup | Scaffold `hooks-demo` with Vite; install json-server; create `db.json`, stylesheet, `AuthContext`, and messy starter `App.jsx`; confirm all three panels work |
| 25 min | Part 1: `useAuth` | Examine the problem with direct `useContext` calls; create `src/hooks/useAuth.js` with an error guard; update `AuthPanel`; verify the guard fires outside the provider |
| 30 min | Part 2: `useDebounce` | Explain the debounce mechanism; create `src/hooks/useDebounce.js`; simplify `SearchPanel`; Activity: add `TagSearchPanel` using the same hook |
| 40 min | Part 3: `useDataLoader` | Demonstrate the stale-data bug with a toggle and artificial delay; add the `ignore` flag fix inline; extract into `src/hooks/useDataLoader.js`; update `DataPanel`; Activity: add `TagsDataPanel` on a different endpoint |
| 10 min | React Query overview | Comparison table: what `useDataLoader` handles vs what React Query adds; one code example; no lab work |
| 5 min | Wrap up and Q&A | Summary table; bonus challenges; common pitfalls recap |
| **Total** | | **160 min** |
