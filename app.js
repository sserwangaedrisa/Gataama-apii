require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');

const UserRoutes = require('./routes/user')
const DonateRoutes = require('./routes/donation')
const ContactRoutes = require('./routes/contact')

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
require('./middleware/socket')(io);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});
app.use(morgan('dev'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/user', UserRoutes);
app.use('/donate', DonateRoutes);
app.use('/contact', ContactRoutes);

app.use(express.static(path.join(__dirname, 'uploads')));

// handle errors
app.use((req, res, next) => {
  res.status(500).json({
    success: false,
    message: process.env.ERROR_MESSAGE,
  });
});
app.use((error, req, res) => {
  res.status(error.status || 500).json({
    success: false,
    message: process.env.ERROR_MESSAGE,
  });
});
const startServer = (port) => {
  try {
    server.listen(port, () => {
      console.log(`Api running at: http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Server failed to start ', error);
    process.exit();
  }
};
startServer(process.env.PORT);
