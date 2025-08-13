const { z } = require("zod");

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(1, "Password is required")
});

module.exports = { signupSchema, loginSchema };
