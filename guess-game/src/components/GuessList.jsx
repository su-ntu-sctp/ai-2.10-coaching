import { useContext } from "react";

import { GameContext } from "../contexts/GameContext";
import GuessItem from "./GuessItem";
import styles from "./GuessList.module.css";

function GuessList() {
  const { state } = useContext(GameContext);

  if (state.guesses.length === 0) return null;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Past Guesses</h2>
      <ul className={styles.list}>
        {state.guesses.map((guess, index) => (
          <GuessItem key={index} guess={guess} secretNumber={state.secretNumber} />
        ))}
      </ul>
    </div>
  );
}

export default GuessList;
