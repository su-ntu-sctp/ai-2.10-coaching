import styles from "./GuessItem.module.css";

function GuessItem({ guess, secretNumber }) {
  // Conditional rendering 
  // to display the appropriate message based on the guess compared to the secret number.
  let message;
  if (guess > secretNumber) {
    message = "⬆️ Too high";
  } else if (guess < secretNumber) {
    message = "⬇️ Too low";
  } else {
    message = "✅ Correct!";
  }

  return (
    <li className={styles.item}>
      <span className={styles.number}>{guess}</span>
      <span className={styles.message}>{message}</span>
    </li>
  );
}

export default GuessItem;
