import { useContext, useState } from "react";

import { GameContext } from "../contexts/GameContext";
import styles from "./GuessInput.module.css";

function GuessInput() {
  const { state, dispatch } = useContext(GameContext);
  const [inputValue, setInputValue] = useState("");

  const inputChangeHandler = (e) => {
    setInputValue(e.target.value);
  };

  const submitHandler = (e) => {
    e.preventDefault();

    const guess = parseInt(inputValue, 10);
    if (isNaN(guess)) return;

    dispatch({ type: "SUBMIT_GUESS", payload: guess });
    setInputValue("");
  };

  const disabled = state.status !== "playing";

  return (
    <form className={styles.form} onSubmit={submitHandler}>
      <label htmlFor="guess-input">Enter a number between 1 and 20</label>
      <div className={styles.controls}>
        <input
          id="guess-input"
          className={styles.input}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={inputChangeHandler}
          disabled={disabled}
        />
        <button className={styles.button} type="submit" disabled={disabled}>
          Guess
        </button>
      </div>
    </form>
  );
}

export default GuessInput;
