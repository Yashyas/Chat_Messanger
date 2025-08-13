const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  from: String,
  to: String,
  contactName: String,
  timestamp: Number,
  type: String,
  text: String,
  status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  statusTimestamp: Number,
  rawPayload: Object
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
