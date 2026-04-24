import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { initSockets } from "./sockets";

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  const httpServer = http.createServer(app);
  const io = initSockets(httpServer);

  // Make io accessible in controllers via app locals
  app.locals.io = io;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
