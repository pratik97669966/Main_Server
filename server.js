const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const profanity = require("profanity-hindi");
const PORT = process.env.PORT || 3030;
// Connect to MongoDB
mongoose.connect("mongodb+srv://root:root@telusko.rb3lafm.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a chat message schema
const chatMessageSchema = new mongoose.Schema({
  roomId: String,
  messages: [{
    userId: String,
    userName: String,
    message: String,
    createdAt: Date
  }]
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName, lastSeenMessageId) => {
    socket.join(roomId);

    // Retrieve the chat history from MongoDB if lastSeenMessageId is not null
    if (lastSeenMessageId !== null) {
      ChatMessage.findOne({ roomId: roomId }, (err, chatMessage) => {
        if (err) {
          console.error(err);
          return;
        }
        if (!chatMessage) {
          // Chat history not found for this room
          return;
        }
        const messages = chatMessage.messages;
        // Send the chat history to the client
        socket.emit("chat-history", messages);
      });
    }
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      var isDirty = profanity.isMessageDirty(message);
      if (isDirty) {
        message = "<span style='color: red;'>🚨 Using bad word may ban your account permanently</span>";
      } else {
        // Save the chat message to MongoDB
        ChatMessage.findOneAndUpdate(
          { roomId: roomId },
          { $push: { messages: { userId: userId, userName: userName, message: message, createdAt: new Date() } } },
          { new: true, upsert: true }
        )
          .then((chatMessage) => {
            io.to(roomId).emit("createMessage", message, userName);
          })
          .catch((error) => {
            console.error(error);
          });
      }
    });

  });
});


server.listen(PORT, () => {
  console.log(`The server is Listening on${PORT}`);
});
