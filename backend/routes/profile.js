const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
router.get("/profile", async (req, res) => {
  const user = await User.findById(req.user._id).populate("orders");
  res.render("users/profile", { user });
});
