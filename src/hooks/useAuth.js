import { useCallback, useState } from "react";
import { useApi } from "./useApi";

const userStorageKey = "descoreUser";

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
}

export function useAuth() {
  const { request, isLoading, error } = useApi();
  const [user, setUser] = useState(getStoredUser);

  const register = useCallback(
    async ({ email, username, password }) => {
      const payload = { email, username, password };
      const registeredUser = import.meta.env.VITE_API_URL
        ? await request("/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        : { email, username };

      saveUser(registeredUser);
      setUser(registeredUser);
      return registeredUser;
    },
    [request],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(userStorageKey);
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setUser(null);
  }, []);

  return { user, isAuthenticated: Boolean(user), register, logout, isLoading, error };
}
