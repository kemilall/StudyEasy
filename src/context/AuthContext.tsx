import React from 'react';

export type AuthProviderType = 'apple' | 'google' | 'email';

export type UserProfile = {
  name: string;
  email: string;
  avatar: string;
  fieldOfStudy: string;
  university: string;
  bio?: string;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (provider: AuthProviderType, profileOverrides?: Partial<UserProfile>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
};

const defaultProfile: UserProfile = {
  name: 'Alex Étudiant',
  email: 'etudiant@example.com',
  avatar: '🧠',
  fieldOfStudy: 'Sciences cognitives',
  university: 'Université de Paris',
  bio: 'Toujours prêt à apprendre avec StudyEasy.'
};

const AuthContext = React.createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  login: () => undefined,
  logout: () => undefined,
  updateProfile: () => undefined,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<UserProfile | null>(null);

  const login = React.useCallback<
    AuthContextValue['login']
  >((provider, profileOverrides) => {
    setUser(prev => ({
      ...defaultProfile,
      ...prev,
      ...profileOverrides,
    }));
    setIsAuthenticated(true);
  }, []);

  const logout = React.useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const updateProfile = React.useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
      const nextProfile = {
        ...defaultProfile,
        ...prev,
        ...updates,
      };
      return nextProfile;
    });
  }, []);

  const value = React.useMemo(
    () => ({ isAuthenticated, user, login, logout, updateProfile }),
    [isAuthenticated, user, login, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);

