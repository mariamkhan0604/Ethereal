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

router.post("/wishlist/:productId", isLoggedIn, async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.productId;

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    // If wishlist doesn't exist, create new
    wishlist = new Wishlist({
      user: userId,
      products: [productId],
    });
  } else {
    const index = wishlist.products.indexOf(productId);
    if (index > -1) {
      // Remove product if already in wishlist
      wishlist.products.splice(index, 1);
    } else {
      // Add product to wishlist
      wishlist.products.push(productId);
    }
  }

  await wishlist.save();
  res.redirect("shop");
});

module.exports = router;
