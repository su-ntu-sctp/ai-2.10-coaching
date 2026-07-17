import { createContext, useReducer } from "react";

import { gameReducer, getInitialState } from "../reducers/gameReducer";

// eslint-disable-next-line react-refresh/only-export-components
export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
