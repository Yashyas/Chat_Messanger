const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = "your_jwt_secret_here"; // Use process.env.JWT_SECRET in production

exports.signup = async (req, res) => {
  try {
    const { name, phoneNumber, password } = req.body;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    const user = new User({ name, phoneNumber, password });
    await user.save();

    const token = jwt.sign({ id: user._id, phoneNumber: user.phoneNumber }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: user._id, name: user.name, phoneNumber: user.phoneNumber }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ error: "Invalid phone number or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid phone number or password" });
    }

    const token = jwt.sign({ id: user._id, phoneNumber: user.phoneNumber }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, phoneNumber: user.phoneNumber }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
