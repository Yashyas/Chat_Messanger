const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  participants: [String],
  origin: String,
  expirationTimestamp: Number,
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }]
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);
