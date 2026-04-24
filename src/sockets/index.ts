import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

export const initSockets = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: { origin: "*" }, // tighten this in production
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected: ", socket.id);

    // Client sends workspaceId while they open the app
    socket.on("join-workspace", (workspaceId: string) => {
        socket.join(workspaceId);
        console.log(`${socket.id} joined workspace ${workspaceId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};
