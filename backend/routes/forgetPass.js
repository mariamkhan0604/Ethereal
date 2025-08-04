const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const nodemailer = require("nodemailer");
require("dotenv").config();
//to show page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password"); // Create this EJS page
});
// Step 1: Forgot Password - Send Reset Email
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).send("No user with that email");
  }

  // Generate token
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetLink = `http://localhost:3000/reset-password/${token}`;

  // Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: user.email,
    subject: "Password Reset Link",
    html: `<p>You requested a password reset</p>
           <a href="${resetLink}">Click here to reset</a>`,
  });

  res.send("Password reset link sent to your email");
});

// Step 2: Render Reset Form
router.get("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).send("Token is invalid or has expired");
  }

  res.render("resetPass", { token: req.params.token });
});

// Step 3: Handle New Password Submission
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).send("Token is invalid or has expired");
  }

  user.password = password; // hash it if not using middleware
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  req.flash("success", "Password has been reset successfully. Please login.");
  res.redirect("/auth/login");
});

module.exports = router;
