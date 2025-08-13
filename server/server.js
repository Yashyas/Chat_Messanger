const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);

mongoose.connect("mongodb+srv://admin:admin@todo.l6eu346.mongodb.net/whatsapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
  app.listen(3000, () => console.log("🚀 Server running on port 3000"));
}).catch(err => console.error("MongoDB connection error:", err));
