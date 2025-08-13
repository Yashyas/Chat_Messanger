const express = require("express");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const router = express.Router();

router.post("/whatsapp", async (req, res) => {
  try {
    const payload = req.body;
    const entry = payload.metaData?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    if (!value) return res.status(400).json({ error: "Invalid payload" });

    // --- New messages from WA ---
    if (value.messages) {
      for (const msg of value.messages) {
        const messageId = msg.id || msg.meta_msg_id;
        const exists = await Message.findOne({ messageId });
        if (exists) continue;

        const from = msg.from; // sender
        const to = value.metadata?.display_phone_number; // your WA number
        const contactName = value.contacts?.[0]?.profile?.name || null;

        // Find/create conversation by participants (order does not matter)
        let conversation = await Conversation.findOne({
          participants: { $all: [from, to] }
        });
        if (!conversation) {
          conversation = new Conversation({
            participants: [from, to],
            origin: "user_initiated"
          });
          await conversation.save();
        }

        const newMsg = new Message({
          messageId,
          conversationId: conversation._id,
          from,
          to,
          contactName,
          timestamp: parseInt(msg.timestamp, 10),
          type: msg.type,
          text: msg.text?.body || null,
          status: "sent",
          rawPayload: payload
        });
        await newMsg.save();

        // Link in conversation & emit
        conversation.lastMessage = newMsg._id;
        await conversation.save();
        req.io.to(conversation._id.toString()).emit("message:new", newMsg);
      }
    }

    // --- Status updates from WA ---
    if (value.statuses) {
      for (const st of value.statuses) {
        const messageId = st.id || st.meta_msg_id;
        const updated = await Message.findOneAndUpdate(
          { messageId },
          { status: st.status, statusTimestamp: parseInt(st.timestamp || "0", 10) },
          { new: true }
        );

        // If we also receive conversation metadata, enrich the conversation doc
        if (st.conversation?.id && updated?.conversationId) {
          await Conversation.findByIdAndUpdate(updated.conversationId, {
            $set: {
              conversationId: st.conversation.id,
              origin: st.conversation.origin?.type,
              expirationTimestamp: st.conversation.expiration_timestamp
                ? parseInt(st.conversation.expiration_timestamp, 10)
                : undefined
            }
          }, { new: true });
        }

        if (updated) {
          req.io.to(updated.conversationId.toString()).emit("message:status", {
            messageId: updated.messageId,
            status: st.status
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e);
    res.sendStatus(500);
  }
});

module.exports = router;
