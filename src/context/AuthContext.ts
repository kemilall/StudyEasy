import React from 'react';

export type AuthContextValue = {
  login: () => void;
  logout: () => void;
};

export const AuthContext = React.createContext<AuthContextValue>({
  login: () => {},
  logout: () => {},
});

