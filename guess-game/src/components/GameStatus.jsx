import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import styles from "./GameStatus.module.css";

function GameStatus() {
  const { state } = useContext(GameContext);
  const lastGuess = state.guesses[state.guesses.length - 1];

  let message = "Make your first guess!";
  if (state.status === "won") {
    message = `Correct! The number was ${state.secretNumber}.`;
  } else if (state.status === "lost") {
    message = `Game over! The number was ${state.secretNumber}.`;
  } else if (lastGuess !== undefined) {
    message = lastGuess > state.secretNumber ? "Too high!" : "Too low!";
  }

  return (
    <p className={state.status === "won" ? styles.won : styles.status}>
      {message}
    </p>
  );
}

export default GameStatus;
