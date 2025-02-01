const jwt = require('jsonwebtoken');
const db = require('./db');
const chatMessage = require("../controllers/chat")

module.exports = (io) => {
  // create sockect connection
  const socket = io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('liveLocation', (liveLocationData) => {
      // decode token to get vendorId
      // const decoded = jwt.verify(liveLocationData.token, process.env.JWT_SECRET);
      // update liveLocation table
      db.getConnection((err, connection) => {
        if (err) {
          console.log('err1', err);
        }
        console.log('inside liveLocation', liveLocationData);
        // const vendorId = decoded.id
        const vendorId = 9;
        const updates = {
          status: 1,
          latitude: liveLocationData.latitude,
          longitude: liveLocationData.longitude,
          socketId: socket.id,
        };
        const sql = `UPDATE vendorLocation SET ? WHERE vendorId = ${vendorId}`;
        connection.query(sql, updates, (err1, result) => {
          connection.release();
          if (err1) {
            console.log('err', err1);
          }
        });
      });
    });

    //Ai Chat bot
    socket.on('chatMessage', (messageData) => chatMessage(io, socket, messageData));
    
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
  
  return socket;
};
