import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowed = [
          "http://localhost:5173",
          "http://localhost:3000",
          "https://raktdaan.online",
          "https://www.raktdaan.online",
        ];
        if (!origin || allowed.includes(origin) || origin.startsWith("http://192.168.") || origin.startsWith("http://localhost:")) {
          callback(null, true);
        } else {
          callback(new Error("CORS blocked"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected via socket:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    console.warn("Socket.io not initialized — skipping real-time emit");
    return null;
  }
  return io;
};

