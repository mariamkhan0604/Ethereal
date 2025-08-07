const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Middleware to check if user is logged in
const { isLoggedIn } = require("../utils/middleware.js");

// GET /orders - show all orders for logged-in user
router.get("/orders", isLoggedIn, async (req, res) => {
  try {
    const userEmail = req.user.email; // assuming req.user is populated by passport or session
    const orders = await Order.find({ "customer.email": userEmail }).sort({
      placedAt: -1,
    });

    res.render("order_history", { orders });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while fetching your orders.");
    res.redirect("/");
  }
});

module.exports = router;
