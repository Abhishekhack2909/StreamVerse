import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import http from "http";
import connectDB from "./db/DB.js";
import { app } from "./app.js";
import { initSocketServer } from "./socket.js";

connectDB()
  .then(() => {
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.io
    const io = initSocketServer(server);
    
    // Make io accessible in routes if needed
    app.set("io", io);

    server.on("error", (error) => {
      console.log("Server Error:", error);
      throw error;
    });

    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on PORT: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!", err);
  });
