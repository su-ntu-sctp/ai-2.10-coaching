export function getInitialState() {
  return {
    secretNumber: Math.floor(Math.random() * 20) + 1,
    guesses: [],
    score: 20,
    status: "playing", // "playing" | "won" | "lost"
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const guess = action.payload;
      const isCorrect = guess === state.secretNumber;
      const newScore = isCorrect ? state.score : Math.max(0, state.score - 1);
      const newStatus = isCorrect ? "won" : newScore === 0 ? "lost" : "playing";

      return {
        ...state,
        guesses: [...state.guesses, guess],
        score: newScore,
        status: newStatus,
      };
    }
    case "NEW_GAME":
      return getInitialState();
    default:
      return state;
  }
}
