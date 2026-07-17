# 2.10 Coaching Session: Guarding the Guess Game with React Router and AuthContext

## Session Overview

This coaching session gives learners hands-on practice adding React Router and an authentication gate to a codebase they already know. The session opens with an instructor-led recap of Coaching 2.7 and Lesson 2.8 (see the recap slides in the instructor materials). Learners then spend approximately two hours working through a structured activity using the finished `guess-game` project from Coaching 2.7: creating a separate `AuthContext`, introducing a public `/login` route and a `/game` route, locking `/game` behind a `ProtectedRoute` guard, adding a logout flow, and adding a catch-all 404 page. The session closes with two learner presentations and an instructor walkthrough.

## Dependencies

- [Activity Brief](./lesson.md)
- [Starter Project](./guess-game)

## Session Objectives

- Add React Router to an existing single-page app, splitting it into a public route and a protected route
- Create an `AuthContext` that manages a logged-in user separately from the game's own state
- Implement a `ProtectedRoute` component that redirects unauthenticated visitors to a login page

## Session Plan

| Duration  | What              | How or Why                                                                                                          |
| --------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| 10 min    | Activity briefing | Instructor reads through Parts 1 and 2 and explains how `AuthContext` and `GameContext` stay separate                 |
| ~110 min  | Guided activity   | Learners work through Parts 1A to 1D and Part 2 with hints and reference solutions available; instructor circulates    |
| 30 min    | Debrief           | Two learners present their solutions; instructor walks through the reference solution                                 |
| **Total** |                   | **~150 min**                                                                                                          |
