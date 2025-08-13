require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Inject io into all requests (so controllers/routes can emit)
app.use((req, res, next) => { req.io = io; next(); });

// Routes
app.use("/auth", authRoutes);
app.use("/", messageRoutes);
app.use("/webhook", webhookRoutes);

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔌 client connected:", socket.id);

  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`📌 ${socket.id} joined ${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {
  autoIndex: true
}).then(() => {
  console.log("✅ MongoDB connected");
  server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
}).catch((err) => {
  console.error("MongoDB error:", err);
  process.exit(1);
});
