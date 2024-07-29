require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

// Import routes
const UserRoutes = require("./routes/user");
const DonateRoutes = require("./routes/donation");
const ContactRoutes = require("./routes/contact");
const postRoutes = require("./routes/post");
const categoryRoutes = require("./routes/category");
const commentRoutes = require("./routes/comment");

const app = express();

// Middleware setup
const corsOptions = {
  origin: "*", // Consider specifying allowed origins for better security
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));

// Session and Passport setup
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());

// Static files and routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/healthz", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});
app.use("/posts", postRoutes);
app.use("/categories", categoryRoutes);
app.use("/comments", commentRoutes);
app.use("/user", UserRoutes);
app.use("/donate", DonateRoutes);
app.use("/contact", ContactRoutes);

// Handle errors
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});
app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    err: res.message || "Internal Server Error",
  });
});

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this if you have specific origins to allow
  },
});
require("./middleware/socket")(io);

// Start server
const startServer = (port) => {
  try {
    server.listen(port, () => {
      console.log(`API running at: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server failed to start", error);
    process.exit(1);
  }
};
startServer(process.env.PORT || 3000);
