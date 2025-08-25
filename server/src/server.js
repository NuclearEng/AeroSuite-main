const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const config = require('./config');
const logger = require('./infrastructure/logger');

// Add or update CORS
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Add or update body-parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add or update cookie-parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Add or update helmet
const helmet = require('helmet');
app.use(helmet());

// Add or update morgan
const morgan = require('morgan');
app.use(morgan('dev'));

// Add or update express-session
const session = require('express-session');
app.use(session({
  secret: 'your-secret-key', // Replace with a secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production
}));

// Add or update passport
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

// Add or update flash
const flash = require('connect-flash');
app.use(flash());

// Add or update multer
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
app.use(upload.single('file'));

// Add or update socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes after io

// Start server
const PORT = config.port || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 