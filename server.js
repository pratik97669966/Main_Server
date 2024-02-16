const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const moment = require('moment');
const mongoose = require("mongoose");
const path = require('path'); // Require the path module
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

const connectedUsers = [];

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    console.log('Connected to MongoDB with data clear');
    Room.deleteMany({})
      .then(() => {
        console.log('All documents deleted from users collection on server restart');
      })
      .catch((err) => {
        console.log('Error deleting documents from users collection on server restart:', err);
      });

    app.use(express.static(path.join(__dirname, 'public')));

    io.on("connection", async (socket) => {
      try {
        connectedUsers[socket.id] = socket;

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
          socket.on("room-delete", async (roomuId) => {
            try {
              await Room.findOneAndUpdate(
                { roomuId },
                { $set: { users: [] } }
              );
                const users =  [];
                io.to(roomId).emit("user-list", users);
             
            } catch (error) {
              console.error("Error on room:", error);
            }
          });
        socket.on("disconnect", async () => {
          try {
              await Room.findOneAndDelete(
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
