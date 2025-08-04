const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");
const Order = require("../models/Order.js");
const Category = require("../models/Category");
//Home route
router.get("/", (req, res) => {
  res.render("home", { currentPage: "home" });
});

router.get("/about", (req, res) => {
  res.render("about", { currentPage: "about" });
});

router.get("/contact", (req, res) => {
  res.render("contact", { currentPage: "contact" });
});
//Shop routes
router.get("/shop", async (req, res, next) => {
  try {
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 5000;

    const frontendSelectedCategoryNames = req.query.category
      ? Array.isArray(req.query.category)
        ? req.query.category
        : [req.query.category]
      : [];

    const allCategoriesInDb = await Category.find({});
    const categoryNameToIdMap = {};
    for (const cat of allCategoriesInDb) {
      categoryNameToIdMap[cat.name] = cat._id;
    }

    const backendSelectedCategoryIds = frontendSelectedCategoryNames
      .map((name) => categoryNameToIdMap[name])
      .filter((id) => id);

    let filter = {
      price: {
        $gte: minPrice,
        $lte: maxPrice,
      },
    };

    if (backendSelectedCategoryIds.length > 0) {
      filter.category = { $in: backendSelectedCategoryIds };
    }

    const products = await Product.find(filter);

    // ✅ Wishlist logic here
    let userWishlistProductIds = [];
    if (req.user) {
      const wishlist = await Wishlist.findOne({ user: req.user._id });
      if (wishlist) {
        userWishlistProductIds = wishlist.products.map((p) => p.toString());
      }
    }

    res.render("shop", {
      products,
      minPrice,
      maxPrice,
      categories: allCategoriesInDb.map((cat) => cat.name),
      selectedCategories: frontendSelectedCategoryNames,
      userWishlistProductIds, // ✅ Pass this
      currentPage: "shop",
    });
  } catch (e) {
    console.error("Error in /shop route:", e);
    next(e);
  }
});

module.exports = router;
