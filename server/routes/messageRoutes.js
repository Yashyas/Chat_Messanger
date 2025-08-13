const express = require("express");
const auth = require("../middleware/authMiddleware");
const { listConversations, getConversationMessages, sendMessage } = require("../controllers/messageController");
const { sendMessageSchema } = require("../validators/messageSchemas");
const validateZod = require("../middleware/validateZod");

const router = express.Router();

router.get("/conversations", auth, listConversations);
router.get("/conversations/:id/messages", auth, getConversationMessages);
router.post("/messages", auth, validateZod(sendMessageSchema), sendMessage);

module.exports = router;
