let currentUserId: string | null = null;
let currentIdToken: string | null = null;

export const setCurrentUserSession = (userId: string | null, idToken: string | null) => {
  currentUserId = userId;
  currentIdToken = idToken;
};

export const getCurrentUserId = (): string | null => currentUserId;

export const getCurrentIdToken = (): string | null => currentIdToken;
