const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");
const Order = require("../models/Order.js");
const { checkout } = require("./main_routes.js");
const {isLoggedIn}= require('../utils/middleware.js');

// Add to Cart route
router.post("/add-to-cart", async (req, res) => {
  const { productId } = req.body;
  if (!req.session.cart) {
    req.session.cart = [];
  }
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).send("Product not found");
  }
  const existingItem = req.session.cart.find(
    (item) => item.productId === product._id.toString()
  );
  // Check if the product is already in the cart
    const imageUrl = (product.images && product.images.length > 0)
    ? product.images[0].url
    : '/images/placeholder.png';
  if (existingItem) {
    existingItem.quantity += 1; // Increment quantity
  } else {
    req.session.cart.push({
      productId: product._id.toString(),
      name: product.name,
      image: imageUrl,
      unit_price: product.price,
      quantity: 1,
    }); // Add new item
  }

  // Flash message and redirect
  req.flash("success", "Product added to cart successfully!");
  res.redirect("/shop");
});

//cart route
router.get("/cart",isLoggedIn,(req, res) => {
  const cart = req.session.cart || [];

  // Calculate total price
  const totalPrice = cart.reduce((total, item) => {
    return total + item.unit_price * item.quantity;
  }, 0);

  res.render("cart", { cart, totalPrice });
});

//update cart route
router.post("/cart/update/:productId", (req, res) => {
  const { productId } = req.params;
  const { action } = req.body;

  let cart = req.session.cart || [];
  const itemIndex = cart.findIndex((item) => item.productId === productId);
  if (itemIndex === -1) {
    return res.redirect("/cart");
  }
  const item = cart[itemIndex];

  if (action === "increase") {
    item.quantity += 1;
  } else if (action === "decrease") {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart.splice(itemIndex, 1); // Remove item if quantity is zero
    }
  } else if (action === "remove") {
    cart.splice(itemIndex, 1); // Remove item from cart
  }
  req.session.cart = cart; // Update session cart
  req.flash("success", "Cart updated successfully!");
  res.redirect("/cart");
});

//Checkout route
// Checkout route
// router.get("/checkout", async (req, res) => {
//   const cart = req.session.cart || [];
//   let totalPrice = 0;
//   cart.forEach((item) => {
//     totalPrice += item.unit_price * item.quantity;
//   });
//   res.render("checkout", { cart, totalPrice });
// });

router.get("/checkout", isLoggedIn,(req, res) => {
  const cart = req.session.cart || [];

  // Calculate total price
  const totalPrice = cart.reduce((total, item) => {
    return total + item.unit_price * item.quantity;
  }, 0);

  res.render("checkout", { cart, totalPrice });
});

//place order post request
router.post("/placeOrder",isLoggedIn,async (req, res) => {
  const cart = req.session.cart || [];

  if (!cart.length) {
    return res.alert("Cart is empyt");
  }
  const { fullName, address, city, pincode, email, payment } = req.body;

  let totalAmount = 0;
  const items = cart.map((item) => {
    totalAmount += item.quantity * item.unit_price;
    return {
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    };
  });
  const newOrder = new Order({
    customer: {
      fullName,
      address,
      city,
      pincode,
      email,
    },
    paymentMethod: payment,
    items,
    totalAmount,
  });

  await newOrder.save();

  //clear cart
  req.session.cart = [];

  // redirect to sucess page
  res.render("order-success");
});

//Order sucees page
router.get("/order-success", (req, res) => {
  res.render("order-success");
});

module.exports = router;
