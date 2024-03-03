const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const mongoose = require("mongoose");
const path = require('path');
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3030;
const MONGODB_URI = "mongodb+srv://dreamercloudofficial:dreamercloudofficial@rooms.drpj12s.mongodb.net/?retryWrites=true&w=majority";

const Room = mongoose.model("Room", new mongoose.Schema({
  roomId: String,
  users: [{
    uId: String,
    socketId: String,
    userName: String,
    profile: String,
    verified: Boolean,
    coHost: Boolean,
    microphone: Boolean,
    listenOnly: Boolean
  }]
}));

app.get("/", (req, res) => {
  res.status(200).send("Welcome to our application!");
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {

    app.use(express.static(path.join(__dirname, 'public')));

    io.on("connection", async (socket) => {
      try {
        socket.on("join-room", async (roomId, uId, userName, profile, verified, coHost, microphone, listenOnly) => {
          socket.join(roomId);
          const user = {
            uId,
            socketId: socket.id,
            userName,
            profile,
            verified,
            coHost,
            microphone,
            listenOnly
          };
          await Room.findOneAndUpdate(
            { roomId },
            { $addToSet: { users: user } },
            { upsert: true, new: true }
          );
          const updatedRoom = await Room.findOne({ roomId });
          const users = updatedRoom ? updatedRoom.users : [];
          io.to(roomId).emit("user-list", users);
        });

        socket.on("update-user", async (roomId, uId, userName, profile, verified, coHost, microphone, listenOnly) => {
          try {
            const user = {
              uId,
              socketId: socket.id,
              userName,
              profile,
              verified,
              coHost,
              microphone,
              listenOnly
            };
            await Room.findOneAndUpdate(
              { roomId, "users.uId": uId },
              { $set: { "users.$": user } },
              { new: true }
            );
            const updatedRoom = await Room.findOne({ roomId });
            const users = updatedRoom ? updatedRoom.users : [];
            io.to(roomId).emit("user-list", users);
          } catch (error) {
            console.error("Error updating user:", error);
          }
        });

        socket.on("room-delete", async (roomId) => {
          try {
            await Room.findOneAndDelete(
              { roomId }
            );
            io.to(roomId).emit("user-list", []);
          } catch (error) {
            console.error("Error deleting room:", error);
          }
        });

        socket.on("room-update", async (roomId, room) => {
          try {
            io.to(roomId).emit("room-change", room);
          } catch (error) {
            console.error("Error updating room:", error);
          }
        });

        socket.on("chat-message", (roomId, uId, userName, message, profile) => {
          const createdAt = Date.now();;
          io.to(roomId).emit("message", { uId, userName, message, profile, createdAt });
        });

        socket.on("disconnect", async () => {
          try {
              await Room.updateOne(
                { roomId },
                { $pull: { users: { socketId: socket.id } } }
              );
              const updatedRoom = await Room.findOne({ roomId });
              const users = updatedRoom ? updatedRoom.users : [];
              io.to(roomId).emit("user-list", users);
         
          } catch (error) {
            console.error("Error on disconnect:", error);
          }
        });

        socket.on("remove-user", async (roomId, uId) => {
          try {
            await Room.updateOne(
              { roomId },
              { $pull: { users: { uId } } }
            );
            const updatedRoom = await Room.findOne({ roomId });
            const users = updatedRoom ? updatedRoom.users : [];
            io.to(roomId).emit("user-list", users);
          } catch (error) {
            console.error("Error removing user:", error);
          }
        });

      } catch (error) {
        console.error("Socket error:", error);
      }
    });

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB:', err);
  });
