const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const players = {};

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Set initial player position
  players[socket.id] = {
    x: Math.random() * 10,
    y: 0,
    z: Math.random() * 10,
  };

  // Send the current players to the new player
  socket.emit("currentPlayers", players);

  // Broadcast the new player to all other players
  socket.broadcast.emit("newPlayer", { id: socket.id, position: players[socket.id] });

  // Handle player movement
  socket.on("move", (position) => {
    if (players[socket.id]) {
      players[socket.id] = position;
      socket.broadcast.emit("playerMoved", { id: socket.id, position });
    }
  });

  // Handle name change event
  socket.on("changeName", (newName) => {
    console.log(`Name changed for ${socket.id} to ${newName}`);
    io.emit("updateName", { id: socket.id, name: newName });
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(3000, () => console.log("Server running on http://localhost:3000"));
