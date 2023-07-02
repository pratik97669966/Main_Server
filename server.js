const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e8,
});
io.sockets.setMaxListeners(5000);

const PID = process.pid;
const PORT = process.env.PORT || 3000;

console.log('Deployment Done !!');
app.use(express.static(path.join(__dirname, 'public')));
const users = [];
const availableUsers = {
  any: [],
  male: [],
  female: []
};
const matchTimeout = 2 * 60 * 1000; // 2 minutes in milliseconds

io.on('connection', socket => {
  // When a user connects to the server
  console.log(`connected ${socket.id} `);

  // When the user sends their data to the server
  socket.on('user_data', data => {
    const user = { id: socket.id, ...data };
    users.push(user);
    availableUsers[user.gender].push(user);
  });

  // When the user searches for a match
  socket.on('search', gender => {
    let match;

    if (gender === 'any') {
      const genders = ['male', 'female'];
      const randomGender = genders[Math.floor(Math.random() * genders.length)];
      match = availableUsers[randomGender].pop();
    } else {
      match = availableUsers[gender].pop();
    }

    if (match) {
      // Send a "matched" event to both users
      socket.emit('matched', match);
      io.to(match.id).emit('matched', user);

      // Remove users from available users
      const userIndex = availableUsers[user.gender].findIndex(u => u.id === user.id);
      availableUsers[user.gender].splice(userIndex, 1);

      const matchIndex = availableUsers[match.gender].findIndex(u => u.id === match.id);
      availableUsers[match.gender].splice(matchIndex, 1);
    } else {
      // Set a timeout to wait for a match
      const timeout = setTimeout(() => {
        // Send a "no match" event to the user
        socket.emit('no_match');
      }, matchTimeout);

      // Store the timeout in the socket object
      socket.matchTimeout = timeout;
    }
  });

  // When the user disconnects from the server
  socket.on('disconnect', () => {
    // Remove the user's data from the user data list
    const index = users.findIndex(u => u.id === socket.id);
    const user = users[index];

    // Remove the user from the available user list
    const availableIndex = availableUsers[user.gender].findIndex(u => u.id === user.id);
    availableUsers[user.gender].splice(availableIndex, 1);

    users.splice(index, 1);

    // Clear the match timeout if it exists
    if (socket.matchTimeout) {
      clearTimeout(socket.matchTimeout);
    }
    console.log('User disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`The server is Listening on http://localhost:${PORT} \nPID: ${PID}\n`);
});

