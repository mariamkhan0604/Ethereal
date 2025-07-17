const mongoose = require('mongoose');
const Category = require('../models/Category');
const categories = require('./categories');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

async function seedCategories() {
  await Category.deleteMany({});
  const savedCategories = await Category.insertMany(categories);
  console.log("Categories seeded!");
  console.log(savedCategories);
  mongoose.connection.close();
}

seedCategories();
