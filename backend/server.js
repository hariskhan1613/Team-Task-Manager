const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { initSocket } = require("./utils/socket");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*"
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Team Task Manager API is running." });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/invitations", require("./routes/invitationRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
