const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const moment = require('moment');
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 3030;
const MONGODB_URI = "mongodb+srv://dreamercloudofficial:dreamercloudofficial@rooms.drpj12s.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Room = mongoose.model("Room", new mongoose.Schema({
  roomId: String,
  users: [{
    uId: String,
    userName: String,
    profile: String,
    verified: Boolean,
    coHost: Boolean,
    microphone: Boolean,
    listenOnly: Boolean
  }]
}));



app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

io.on("connection", async (socket) => {
  console.log(`onconnection: ${socket}`);
  try {
    socket.on("join-room", async (roomId, uId, userName, profile, verified, coHost, microphone, listenOnly) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
      console.log(`User joined : ${userName}`);
      const user = {
        uId,
        userName,
        profile,
        verified,
        coHost,
        microphone,
        listenOnly
      };
       Room.findOneAndUpdate(
        { roomId },
        { $addToSet: { users: user } },
        { upsert: true, new: true }
      ).then((usersList) => {
        const savedMessage = chatMessage.messages[chatMessage.messages.length - 1]; // Get the last message in the array
        io.to(roomId).emit("createMessage", savedMessage, userName); // Emit the saved message instead of the original message
      })
      .catch((error) => {
        console.error(error);
      });
      const updatedRoom = await Room.findOne({ roomId });
      const users = updatedRoom ? updatedRoom.users : [];
      io.to(roomId).emit("user-list", users);
    });

    socket.on("update-user", async (roomId, uId, updatedData) => {
      await Room.updateOne(
        { roomId, "users.uId": uId },
        { $set: { "users.$": updatedData } }
      );
      const updatedRoom = await Room.findOne({ roomId });
      const users = updatedRoom ? updatedRoom.users : [];
      io.to(roomId).emit("user-list", users);
    });

    socket.on("disconnect", async () => {
      const rooms = Object.keys(socket.rooms);
      const roomId = rooms.find(room => room !== socket.id);
      if (roomId) {
        await Room.findOneAndUpdate(
          { roomId },
          { $pull: { users: { uId: socket.id } } }
        );
        const updatedRoom = await Room.findOne({ roomId });
        const users = updatedRoom ? updatedRoom.users : [];
        io.to(roomId).emit("user-list", users);
      }
    });
  } catch (error) {
    console.error("Socket error:", error);
  }
});



server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
