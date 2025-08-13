const mongoose = require("mongoose");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

exports.listConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.phoneNumber
    })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("List conversations error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid conversation id" });
    }

    const conv = await Conversation.findById(id);
    if (!conv || !conv.participants.includes(req.user.phoneNumber)) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId: id }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Get conversation messages error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { to, text, conversationId } = req.body;

    // Validate required fields
    if (!conversationId && !to) {
      return res.status(400).json({
        error: "Either conversationId or 'to' must be provided"
      });
    }
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(req.user.phoneNumber)) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = await Conversation.findOne({
        participants: { $all: [req.user.phoneNumber, to] }
      });
      if (!conversation) {
        conversation = new Conversation({
          participants: [req.user.phoneNumber, to],
          origin: "business_initiated"
        });
        await conversation.save();
      }
    }

    // Create local message with guaranteed unique ID
    const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const msgDoc = new Message({
      messageId: localId,
      conversationId: conversation._id, // Always set here
      from: req.user.phoneNumber,
      to: to || conversation.participants.find(p => p !== req.user.phoneNumber),
      type: "text",
      text,
      status: "sent",
      timestamp: Math.floor(Date.now() / 1000)
    });
    await msgDoc.save();

    // Update conversation's last message
    conversation.lastMessage = msgDoc._id;
    await conversation.save();

    // Emit to conversation room for real-time updates
    req.io.to(conversation._id.toString()).emit("message:new", msgDoc);

    res.status(201).json(msgDoc);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};
