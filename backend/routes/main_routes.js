const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");
const Order = require("../models/Order.js");

//Home route
router.get("/", (req, res) => {
  res.render("home");
});

//About and Contact routes
router.get("/about", (req, res) => {
  res.render("about");
});
router.get("/contact", (req, res) => {
  res.render("contact");
});

//Shop routes
router.get("/shop", async (req, res) => {
  const products = await Product.find({});
  res.render("shop", { products });
});

module.exports = router;
