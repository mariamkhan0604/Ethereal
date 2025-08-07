const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");
const { isLoggedIn } = require("../utils/middleware");
router.get("/checkout/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/shop");
    }

    res.render("singleProductCheckout", { product });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong.");
    res.redirect("/shop");
  }
});
router.post("/cart/add/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/shop");
    }

    if (!req.session.cart) req.session.cart = [];

    const existingIndex = req.session.cart.findIndex(
      (item) => item.product._id.toString() === product._id.toString()
    );

    if (existingIndex > -1) {
      req.session.cart[existingIndex].quantity += 1;
    } else {
      req.session.cart.push({ product, quantity: 1 });
    }

    req.flash("success", "Product added to cart!");
    res.redirect(`/product/${req.params.productId}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not add product to cart.");
    res.redirect(`/product/${req.params.productId}`);
  }
});
module.exports = router;
