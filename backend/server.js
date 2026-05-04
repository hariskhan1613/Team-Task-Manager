const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const morgan = require("morgan");

const connectDB = require("./config/db");
const { initSocket } = require("./utils/socket");

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// ✅ CORS CONFIG (FIXED FOR LOCAL + PRODUCTION)
const allowedOrigins = [
  "http://localhost:5173",
  "https://team-task-manager-1wve.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true
  })
);

// Middlewares
app.use(express.json());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Team Task Manager API is running 🚀" });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/invitations", require("./routes/invitationRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

// Init Socket
initSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});