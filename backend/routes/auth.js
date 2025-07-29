const express = require("express");
const router = express.Router();
const User = require("../models/User");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const bcrypt = require("bcrypt");

router.get("/register", (req, res) => {
  res.render("auth/register");
});
router.post(
  "/register",
  catchAsync(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // throw new ExpressError('Email already registered.', 400);
      req.flash("error", "Email is already registered.");
      return res.redirect("/auth/login");
    }
    const newUser = new User({ firstName, lastName, email, password });
    await newUser.save();
    console.log(" User saved:", newUser);
    res.redirect("/");
  })
);

router.get("/login", (req, res) => {
  res.render("auth/login");
});
router.post(
  "/login",
  catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // throw new ExpressError('Email already registered.', 400);
      req.flash("error", "User does not exist. Please register first.");
      return res.redirect("/auth/register");
    }
    console.log("hello");
    const isValid = await bcrypt.compare(password, existingUser.password);

    req.session.user = existingUser._id;
    console.log("Password is valid:", isValid);
    console.log("Redirecting to / with session user:", req.session.user);
    console.log("User from DB:", existingUser);
    console.log("Password entered:", password);
    console.log("Password stored:", existingUser.password);
    if (!isValid) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/auth/login");
    }
    req.flash("success", `Welcome back, ${existingUser.firstName}!`);
    console.log("✅ Login successful:", existingUser.email);
    res.redirect("/");
  })
);
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});

module.exports = router;
