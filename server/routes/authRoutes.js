const express = require("express");
const { signup, login } = require("../controllers/authController");
const { signupSchema, loginSchema } = require("../validators/authSchemas");
const validateZod = require("../middleware/validateZod");

const router = express.Router();

router.post("/signup", validateZod(signupSchema), signup);
router.post("/login", validateZod(loginSchema), login);

module.exports = router;
