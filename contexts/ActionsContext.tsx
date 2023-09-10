import { createContext, useContext } from 'react';

enum Actions {
  EDIT = 'edit',
}

type ActionsContextType = {
  playerActions: Actions[];
  gmActions: Actions[];
};

const ActionsContext = createContext<ActionsContextType>({
  playerActions: [],
  gmActions: [],
});

export const useActions = (): ActionsContextType => useContext(ActionsContext);

export const ActionsProvider: React.FC<{
  children: JSX.Element;
}> = ({ children }) => {
  return (
    <ActionsContext.Provider
      value={{
        playerActions: [Actions.EDIT],
        gmActions: [Actions.EDIT],
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};
