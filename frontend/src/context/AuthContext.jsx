import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { createSocket } from "../api/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("ttm_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("ttm_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const saveAuth = (nextToken, nextUser) => {
    localStorage.setItem("ttm_token", nextToken);
    localStorage.setItem("ttm_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearAuth = () => {
    localStorage.removeItem("ttm_token");
    localStorage.removeItem("ttm_user");
    setToken(null);
    setUser(null);
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    saveAuth(data.token, data.user);
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    saveAuth(data.token, data.user);
  };

  const logout = () => clearAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
      }
      setSocket(null);
      return undefined;
    }

    const nextSocket = createSocket(token);
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const validateSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      socket,
      signup,
      login,
      logout
    }),
    [token, user, loading, socket]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
