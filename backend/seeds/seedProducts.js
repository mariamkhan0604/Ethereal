const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const productsData = require("./products");
require("dotenv").config();

mongoose
  .connect(process.env.DATABASE_URL) // from .env file
  .then(() => {
    console.log("DB connected");
    return seedProducts();
  })
  .catch((err) => console.error("Mongo error:", err));

async function seedProducts() {
  try {
    await Product.deleteMany({});
    const categories = await Category.find({});

    const categoryMap = {};
    for (let cat of categories) {
      categoryMap[cat.name] = cat._id;
    }

    const products = productsData.map((prod) => ({
      ...prod,
      category: categoryMap[prod.categoryName],
    }));

    await Product.insertMany(products);
    console.log("Products seeded!");
    mongoose.connection.close();
  } catch (err) {
    console.error("Seeding error:", err);
    mongoose.connection.close();
  }
}
