
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

  players[socket.id] = {
    x: Math.random() * 10,
    y: 0,
    z: Math.random() * 10,
  };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", { id: socket.id, position: players[socket.id] });

  socket.on("move", (position) => {
    if (players[socket.id]) {
      players[socket.id] = position;
      socket.broadcast.emit("playerMoved", { id: socket.id, position });
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
