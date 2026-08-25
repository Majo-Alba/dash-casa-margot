import { createContext } from 'react';

export const UserContext = createContext({
  loggedUser: null,
  setLoggedUser: () => {},
});
