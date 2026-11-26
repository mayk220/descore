import { useCallback, useState } from "react";
import { useApi } from "./useApi";

const userStorageKey = "descoreUser";
const tokenStorageKey = "descoreToken";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey) || "null");
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(userStorageKey, JSON.stringify(user));
  localStorage.setItem("userName", user.username);
  localStorage.setItem("userEmail", user.email);
  if (user.token) localStorage.setItem(tokenStorageKey, user.token);
}

export function useAuth() {
  const { request, isLoading, error } = useApi();
  const [user, setUser] = useState(getStoredUser);

  const register = useCallback(
    async ({ email, username, password }) => {
      const payload = { email, username, password };
      const registeredUser = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      saveUser(registeredUser);
      setUser(registeredUser);
      return registeredUser;
    },
    [request],
  );

  const login = useCallback(
    async ({ email, password }) => {
      const loggedInUser = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveUser(loggedInUser);
      setUser(loggedInUser);
      return loggedInUser;
    },
    [request],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(userStorageKey);
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem(tokenStorageKey);
    setUser(null);
  }, []);

  return { user, isAuthenticated: Boolean(user), register, login, logout, isLoading, error };
}
