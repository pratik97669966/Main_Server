const path = require('path');
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e8,
});
io.sockets.setMaxListeners(5000);
const mydata = [
  {
    "name": "Sneha",
    "isReadyToTalk": false,
    "isVerified": false,
    "opentalks": 4382,
    "rating": 9474,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "MALE",
    "talkingmin": 3823,
    "uId": "fdhasfkhljpjodgvjndglvkdlgvkjnd",
    "description": "I love to play soccer and travel to new places. Looking to connect with others who share similar interests.",
    "token": "test",
    "username": "sneha46"
  },
  {
    "name": "Lila",
    "isReadyToTalk": false,
    "isVerified": true,
    "opentalks": 2498,
    "rating": 8542,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "FEMALE",
    "talkingmin": 1392,
    "uId": "fdhasfkhljpjodgvjndglvkdlhjkjnd",
    "description": "I am an artist who enjoys painting and sketching. Looking for someone to talk to about art and maybe exchange ideas.",
    "token": "test",
    "username": "lila32"
  },
  {
    "name": "John",
    "isReadyToTalk": false,
    "isVerified": true,
    "opentalks": 1276,
    "rating": 7635,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "MALE",
    "talkingmin": 924,
    "uId": "fdhasfkhljpjodgvjndghjkdlgvkjnd",
    "description": "I'm an entrepreneur and love discussing business and startups. Let's chat and share ideas.",
    "token": "test",
    "username": "johnny"
  },
  {
    "name": "Sophie",
    "isReadyToTalk": false,
    "isVerified": true,
    "opentalks": 2893,
    "rating": 9312,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "FEMALE",
    "talkingmin": 1867,
    "uId": "fdhasfkhljpjodgghjndglvkdlgvkjnd",
    "description": "I'm a foodie and love trying out new recipes. Looking for someone to share recipes and cooking tips with.",
    "token": "test",
    "username": "sophielovesfood"
  },
  {
    "name": "Sam",
    "isReadyToTalk": false,
    "isVerified": false,
    "opentalks": 982,
    "rating": 6243,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "MALE",
    "talkingmin": 539,
    "uId": "fdhasfkhljpjodhjhjndglvkdlgvkjnd",
    "description": "I'm a music lover and enjoy playing guitar. Looking for someone to chat with about music and maybe jam together.",
    "token": "test",
    "username": "sammyguitar"
  },
  {
    "name": "Maria",
    "isReadyToTalk": false,
    "isVerified": false,
    "opentalks": 302,
    "rating": 4215,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "FEMALE",
    "talkingmin": 239,
    "uId": "fdhasfkhljpjodgjkjndglvkdlgvkjnd",
    "description": "I'm a fitness enthusiast and enjoy working out. Looking for someone to motivate me and maybe workout together.",
    "token": "test",
    "username": "mariafit"
  },
  {
    "name": "William",
    "isReadyToTalk": false,
    "isVerified": true,
    "opentalks": 564,
    "rating": 7856,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "MALE",
    "talkingmin": 342,
    "uId": "fdhasfkhljpjoghjgvjndglvkdlgvkjnd",
    "description": "I'm a traveler and enjoy exploring new places. Looking for someone to share travel stories and maybe plan a trip together.",
    "token": "test",
    "username": "williamtravels"
  },
  {
    "name": "Emma",
    "isReadyToTalk": false,
    "isVerified": true,
    "opentalks": 1483,
    "rating": 9123,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "FEMALE",
    "talkingmin": 943,
    "uId": "fdhasfkhljpjoghgvjndglvkdlgvkjnd",
    "description": "I'm a bookworm and love reading. Looking for someone to talk about books and maybe exchange recommendations.",
    "token": "test",
    "username": "emma_reads"
  },
  {
    "name": "Alex",
    "isReadyToTalk": false,
    "isVerified": false,
    "opentalks": 712,
    "rating": 6752,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "MALE",
    "talkingmin": 423,
    "uId": "fdhasfkhljpjodovjndglvkdlgvkjnd",
    "description": "I'm a gamer and enjoy playing video games. Looking for someone to chat about games and maybe play together.",
    "token": "test",
    "username": "alex_gaming"
  },
  {
    "name": "Olivia",
    "isReadyToTalk": false,
    "isVerified": true,
    "opentalks": 3275,
    "rating": 8765,
    "profile": "https://picsum.photos//200?sig=",
    "gender": "FEMALE",
    "talkingmin": 2398,
    "uId": "fdhasfigljpjodgvjndglvkdlgvkjnd",
    "description": "I'm a movie buff and love watching films. Looking for someone to talk about movies and maybe watch together.",
    "token": "test",
    "username": "oliviamoviebuff"
  }

]
const connectedUsers = [];
const PID = process.pid;
const PORT = process.env.PORT || 3000;

const mongoURI = "mongodb+srv://root:root@telusko.rb3lafm.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 500 })
  .then((client) => {
    console.log('Connected to MongoDB');

    const db = client.db('HomeScreen');
    const usersCollection = db.collection('instanttalk');

    app.use(express.static(path.join(__dirname, 'public')));

    // Send the list of all users to the connected client
    const sendUsersList = (socket) => {
      usersCollection.find().toArray()
        .then((users) => {
          socket.emit('users-list', users);
        })
        .catch((err) => {
          console.log('Error getting users from MongoDB:', err);
        });
    };

    // eslint-disable-next-line no-shadow
    io.on('connection', (socket) => {
      console.log(`The socket is connected! Socket id: ${socket.id}`);

      // Send the list of all users to the new client
      connectedUsers[socket.id] = socket;
      sendUsersList(socket);

      // Add a new user to the database
      socket.on('new-user', (user) => {
        user.id = socket.id;
        usersCollection.insertOne(user)
          .then(() => {
            console.log(`User ${user.name} added to MongoDB`);
            io.emit('user-add', user);
          })
          .catch((err) => {
            console.log('Error adding user to MongoDB:', err);
          });
      });
      // Update an existing user in the database
      socket.on('update-user', (user) => {
        user.id = socket.id;
        usersCollection.updateOne(
          { id: socket.id },
          { $set: user }
        )
          .then(() => {
            console.log(`User ${user.name} updated in MongoDB`);
            io.emit('user-update', user);
          })
          .catch((err) => {
            console.log('Error updating user in MongoDB:', err);
          });
      });
      socket.on('insert-all', (users) => {

        const socketId = socket.id;
        const usersWithSocketId = mydata.map((user) => ({ ...user, id: socketId }));

        usersCollection.insertMany(usersWithSocketId)
          .then(() => {
            console.log(`${usersWithSocketId.length} users added to MongoDB`);
            sendUsersList(io);
          })
          .catch((err) => {
            console.log('Error adding users to MongoDB:', err);
          });
      });
      socket.on('is-typing', (username) => {
        socket.broadcast.emit('is-typing', username);
      });
      socket.on('talk-now-accepted', (message) => {
        const recipientSocket = connectedUsers[message.id];
        if (recipientSocket) {
          recipientSocket.emit('talk-now-accepted', message);
        } else {
          console.log('Recipient socket not found');
        }
      });
      socket.on('private-message', (message) => {
        const recipientSocket = connectedUsers[message.id];
        if (recipientSocket) {
          recipientSocket.emit('private-message', message);
        } else {
          console.log('Recipient socket not found');
        }
      });

      socket.on('private-btnRequestAccept', (message) => {
        const recipientSocket = connectedUsers[message.id];
        if (recipientSocket) {
          recipientSocket.emit('private-btnRequestAccept', message);
        } else {
          console.log('Recipient socket not found');
        }
      });
      socket.on('private-btnRequestCancel', (message) => {
        const recipientSocket = connectedUsers[message.id];
        if (recipientSocket) {
          recipientSocket.emit('private-btnRequestCancel', message);
        } else {
          console.log('Recipient socket not found');
        }
      });
      socket.on('private-btnCancel', (message) => {
        const recipientSocket = connectedUsers[message.id];
        if (recipientSocket) {
          recipientSocket.emit('private-btnCancel', message);
        } else {
          console.log('Recipient socket not found');
        }
      });
      // Remove a user from the database
      socket.on('disconnect', () => {
        usersCollection.findOneAndDelete({ id: socket.id })
          .then((result) => {
            const user = result.value;
            if (user) {
              io.emit('user-removed', user);
            }
          })
          .catch((err) => {
            console.log('Error removing user from MongoDB:', err);
          });
        const index = connectedUsers.findIndex((user) => user.id === socket.id);
        if (index !== -1) {
          connectedUsers.splice(index, 1);
          console.log(`User ${socket.id} connectedUsers`);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`The server is Listening on http://localhost:${PORT} \nPID: ${PID}\n`);
    });
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB:', err);
  });