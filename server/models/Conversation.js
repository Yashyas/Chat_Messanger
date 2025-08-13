const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  conversationId: { 
    type: String, 
    required: true, 
    unique: true, 
    default: () => `conv_${Date.now()}_${Math.random().toString(36).substring(2,8)}`
  },
  participants: [String],
  origin: String,
  expirationTimestamp: Number,
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }]
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);
