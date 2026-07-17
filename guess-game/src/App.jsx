import { useContext } from "react";

import GameStatus from "./components/GameStatus";
import GuessInput from "./components/GuessInput";
import GuessList from "./components/GuessList";
import { GameContext } from "./contexts/GameContext";
import styles from "./App.module.css";

function App() {
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

export default App;
