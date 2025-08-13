const { z } = require("zod");

const sendMessageSchema = z.object({
  to: z.string().min(10, "Recipient phone must be at least 10 digits"),
  text: z.string().min(1, "Text is required"),
  conversationId: z.string().optional() // Mongo ObjectId as string (optional)
});

module.exports = { sendMessageSchema };
