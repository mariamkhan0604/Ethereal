const express = require("express");
const router = express.Router();
// const User=require('../models/User');
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");

router.get("/register", (req, res) => {
  res.render("auth/register");
});
router.post(
  "/register",
  catchAsync(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ExpressError("Email already registered.", 400);
    }
    const newUser = new User({ firstName, lastName, email, password });
    await newUser.save();
    console.log("✅ User saved:", newUser);
    res.redirect("/");
  })
);
module.exports = router;
