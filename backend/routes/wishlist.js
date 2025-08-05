const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const Wishlist = require("../models/wishlist.js");
const { isLoggedIn } = require("../utils/middleware.js");
const Product = require("../models/Product.js");
// Import the Wishlist model
// Import the User model

//Get request for wishlist
//render wislist items
router.get("/wishlist", isLoggedIn, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "products"
    );

    const wishlistItems = wishlist ? wishlist.products : [];

    res.render("wishlist", { wishlistItems });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    req.flash("error", "Failed to load wishlist.");
    res.redirect("/shop");
  }
});

//post request for wishlist
// Add a product to the wishlist

router.post("/wishlist/:productId", isLoggedIn, async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  try {
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [productId] });
      await wishlist.save();
      req.flash("success", "Added to wishlist!");
    } else {
      const alreadyExists = wishlist.products.some(
        (id) => id.toString() === productId
      );

      if (!alreadyExists) {
        wishlist.products.push(productId);
        await wishlist.save();
        req.flash("success", "Added to wishlist!");
      } else {
        req.flash("info", "Already in wishlist!");
      }
    }

    res.redirect("/shop");
  } catch (err) {
    console.error("Error updating wishlist:", err);
    req.flash("error", "Something went wrong!");
    res.redirect("/shop");
  }
});

// Remove a product from the wishlist
router.post("/remove/:productId", isLoggedIn, async (req, res) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: userId },
      { $pull: { products: productId } },
      { new: true }
    );

    if (wishlist) {
      req.flash("success", "Removed from wishlist!");
    } else {
      req.flash("error", "Product not found in wishlist.");
    }

    res.redirect("/wishlist");
  } catch (err) {
    console.error("Error removing product from wishlist:", err);
    req.flash("error", "Failed to remove product from wishlist.");
    res.redirect("/wishlist");
  }
});

module.exports = router;
