const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");
const Wishlist = require("../models/wishlist.js");
const {isLoggedIn }= require("../utils/middleware.js");
router.get("/wishlist", isLoggedIn, async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
    "products"
  );

  const wishlistItems = wishlist ? wishlist.products : [];
  res.render("wishlist", { wishlistItems });
});

module.exports = router;
