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

const connectedUsers = [];
const PID = process.pid;
const PORT = 3000;

const mongoURI = "mongodb+srv://root:root@telusko.rb3lafm.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB
MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 500 })
  .then((client) => {
    console.log('Connected to MongoDB with data clear');

    const db = client.db('HomeScreen');
    const usersCollection = db.collection('instanttalk');

    // Add this block to delete all documents from the collection on server restart
    usersCollection.deleteMany({})
      .then(() => {
        console.log('All documents deleted from users collection on server restart');
      })
      .catch((err) => {
        console.log('Error deleting documents from users collection on server restart:', err);
      });

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
        if (user != null && socket != null) {
          user.id = socket.id;
          usersCollection.insertOne(user)
            .then(() => {
              console.log(`User ${user.name} added to MongoDB`);
              io.emit('user-add', user);
            })
            .catch((err) => {
              console.log('Error adding user to MongoDB:', err);
            });
        }
      });
      // Update an existing user in the database
      socket.on('update-user', (user) => {
        user.id = socket.id;
        usersCollection.updateOne(
          { id: socket.id },
          { $set: user }
        )
          .then(() => {
            console.log(`User ${user.username} updated in MongoDB`);
            io.emit('user-update', user);
          })
          .catch((err) => {
            console.log('Error updating user in MongoDB:', err);
          });
      });
      socket.on('insert-all', (users) => {

        // const socketId = socket.id;
        // const usersWithSocketId = mydata.map((user) => ({ ...user, id: socketId }));

        // usersCollection.insertMany(usersWithSocketId)
        //   .then(() => {
        //     console.log(`${usersWithSocketId.length} users added to MongoDB`);
        //     sendUsersList(io);
        //   })
        //   .catch((err) => {
        //     console.log('Error adding users to MongoDB:', err);
        //   });
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
        message.message = "";
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
