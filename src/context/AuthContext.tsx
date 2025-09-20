import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';

import { auth } from '../firebase/config';
import { setApiAuthHeaders } from '../api/client';
import { setCurrentUserSession } from '../state/session';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const ensureSignedIn = async () => {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    };

    ensureSignedIn().catch(() => {
      // Anonymous sign-in failures will surface via auth listener if critical.
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) {
        return;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(true);
          setCurrentUserSession(firebaseUser.uid, idToken);
          setApiAuthHeaders({ userId: firebaseUser.uid, idToken });
        } catch (error) {
          setCurrentUserSession(firebaseUser.uid, null);
          setApiAuthHeaders({ userId: firebaseUser.uid });
        }
      } else {
        setCurrentUserSession(null, null);
        setApiAuthHeaders({});
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
