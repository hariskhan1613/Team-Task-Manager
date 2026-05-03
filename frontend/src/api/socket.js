import { io } from "socket.io-client";

const resolveSocketUrl = () => {
  const rawApiUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (rawApiUrl) {
    return rawApiUrl.replace(/\/api\/?$/, "");
  }
  return "http://localhost:5000";
};

export const createSocket = (token) =>
  io(resolveSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"]
  });
