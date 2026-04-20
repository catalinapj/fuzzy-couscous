import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("access_token")
  );

  const login = useCallback((token) => {
    localStorage.setItem("access_token", token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      login,
      logout,
      isAuthenticated: Boolean(accessToken),
    }),
    [accessToken, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
