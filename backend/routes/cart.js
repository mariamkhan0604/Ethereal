const express = require("express");
const router = express.Router();
const Product = require("../models/Product.js");
const Order = require("../models/Order.js");
const { isLoggedIn } = require('../utils/middleware.js');
const Cart = require("../models/Cart.js"); // 👈 ADD THIS LINE

// Add to Cart route
router.post("/add-to-cart", isLoggedIn, async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user._id;

    try {
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            // Create a new cart if one doesn't exist
            cart = new Cart({ user: userId, items: [] });
        }

        const product = await Product.findById(productId);
        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/shop");
        }

        const existingItem = cart.items.find(
            (item) => item.productId.toString() === productId
        );

        const imageUrl = (product.images && product.images.length > 0)
            ? product.images[0].url
            : '/images/placeholder.png';

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({
                productId: product._id,
                name: product.name,
                image: imageUrl,
                unit_price: product.price,
                quantity: 1,
            });
        }
        await cart.save();
        req.flash("success", "Product added to cart successfully!");
        res.redirect("/shop");
    } catch (err) {
        console.error("Error adding to cart:", err);
        req.flash("error", "Something went wrong!");
        res.redirect("/shop");
    }
});

// cart route
router.get("/cart", isLoggedIn, async (req, res) => {
    const userId = req.session.user._id;
    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.productId');
        const cartItems = cart ? cart.items : [];

        const totalPrice = cartItems.reduce((total, item) => {
            return total + item.unit_price * item.quantity;
        }, 0);

        res.render("cart", { cart: cartItems, totalPrice });
    } catch (err) {
        console.error("Error fetching cart:", err);
        req.flash("error", "Failed to load cart.");
        res.redirect("/shop");
    }
});

// update cart route
router.post("/cart/update/:productId", isLoggedIn, async (req, res) => {
    const { productId } = req.params;
    const { action } = req.body;
    const userId = req.session.user._id;

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            req.flash("error", "Cart not found.");
            return res.redirect("/cart");
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );
        if (itemIndex === -1) {
            req.flash("error", "Item not found in cart.");
            return res.redirect("/cart");
        }
        
        const item = cart.items[itemIndex];

        if (action === "increase") {
            item.quantity += 1;
        } else if (action === "decrease") {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        } else if (action === "remove") {
            cart.items.splice(itemIndex, 1);
        }

        await cart.save();
        req.flash("success", "Cart updated successfully!");
        res.redirect("/cart");
    } catch (err) {
        console.error("Error updating cart:", err);
        req.flash("error", "Failed to update cart.");
        res.redirect("/cart");
    }
});

//Checkout route
router.get("/checkout", isLoggedIn, async (req, res) => {
    const userId = req.session.user._id;
    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.productId');
        const cartItems = cart ? cart.items : [];
        const totalPrice = cartItems.reduce((total, item) => {
            return total + item.unit_price * item.quantity;
        }, 0);

        res.render("checkout", { cart: cartItems, totalPrice });
    } catch (err) {
        console.error("Error fetching cart for checkout:", err);
        req.flash("error", "Failed to load checkout page.");
        res.redirect("/cart");
    }
});

//place order post request
router.post("/placeOrder", isLoggedIn, async (req, res) => {
    const userId = req.session.user._id;
    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart || cart.items.length === 0) {
            req.flash("error", "Cart is empty.");
            return res.redirect("/cart");
        }

        const { fullName, address, city, pincode, email, payment } = req.body;

        let totalAmount = 0;
        const items = cart.items.map((item) => {
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

        // Clear cart from the database
        cart.items = [];
        await cart.save();

        // redirect to success page
        res.render("order-success");
    } catch (err) {
        console.error("Error placing order:", err);
        req.flash("error", "Failed to place order.");
        res.redirect("/checkout");
    }
});

//Order success page
router.get("/order-success", (req, res) => {
    res.render("order-success");
});

module.exports = router;