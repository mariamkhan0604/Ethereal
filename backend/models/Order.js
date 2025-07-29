// models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  name: String,
  quantity: Number,
  unit_price: Number,
});

const orderSchema = new Schema({
  customer: {
    fullName: String,
    address: String,
    city: String,
    pincode: String,
    email: String,
  },
  paymentMethod: String,
  items: [orderItemSchema],
  totalAmount: Number,
  placedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
