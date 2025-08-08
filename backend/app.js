require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const engine = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Category = require("./models/Category");
const User = require("./models/User"); // Corrected User model import
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const multer = require("multer");
const { storage } = require("./cloudinary");
const upload = multer({ storage });
const { isLoggedIn, isAdmin } = require("./utils/middleware");
const nodemailer = require("nodemailer");
const Wishlist = require("./models/wishlist");
const Cart = require("./models/Cart"); // 👈 ADD THIS LINE

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Database connection
console.log("MongoDB URL:", process.env.DATABASE_URL); // Debug line

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Connected to MongoDB", mongoose.connection.host))
  .catch((err) => {
    console.error("MongoDB connection failed:");
    console.error(err.message); // cleaner output
    process.exit(1); // Optional: Exit app on DB failure
  });

// View engine setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

//session
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL,
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};
app.use(session(sessionConfig));
app.use(flash());
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.info = req.flash("info");
  next();
});

// 👈 UPDATED MIDDLEWARE FOR CART & WISHLIST
app.use(async (req, res, next) => {
  if (req.session.user) {
    try {
      // Find the wishlist for the current user
      const wishlist = await Wishlist.findOne({
        user: req.session.user._id,
      });
      res.locals.wishlistCount = wishlist ? wishlist.products.length : 0;

      // Find the cart for the current user
      const cart = await Cart.findOne({
          user: req.session.user._id,
      });
      res.locals.cartCount = cart ? cart.items.length : 0;
    } catch (err) {
      console.error("Error fetching counts:", err);
      res.locals.wishlistCount = 0;
      res.locals.cartCount = 0;
    }
  } else {
    // If no user is logged in, both counts are 0
    res.locals.wishlistCount = 0;
    res.locals.cartCount = 0;
  }
  next();
});

const mainRoutes = require("./routes/main_routes");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const forgetPassRoutes = require("./routes/forgetPass");
const profileRoutes = require("./routes/profile");
const orderRoutes = require("./routes/order");
const directAddRoutes = require("./routes/direct_add");
//route setup
app.use("/", mainRoutes);
app.use("/auth", authRoutes);
app.use("/", cartRoutes);
app.use("/", wishlistRoutes);
app.use("/", forgetPassRoutes);
app.use("/", profileRoutes);
app.use("/", orderRoutes);
app.use("/", directAddRoutes);

app.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).populate("category");
  if (!product) {
    req.flash("error", "Product not found");
    return res.redirect("/shop");
  }
  res.render("product_show", { product });
});
app.get("/products", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("add", { categories, currentPage: "add" });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Error fetching categories");
  }
});
app.post(
  "/products",
  isLoggedIn,
  isAdmin,
  upload.array("images"),
  async (req, res) => {
    try {
      const newProduct = new Product(req.body);

      // Map the files to get their Cloudinary URLs and filenames
      const images = req.files.map((file) => ({
        url: file.path,
        filename: file.filename,
      }));

      // Add the image data to the product instance
      newProduct.images = images;

      // Save the new product to the database
      await newProduct.save();

      console.log(newProduct);

      req.flash("success", "Successfully added new product!");
      res.redirect(`/shop`);
    } catch (err) {
      console.error("Error creating new product:", err);
      req.flash("error", `Error: ${err.message}`);
      res.redirect("/products/new");
    }
  }
);
app.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // <-- USE YOUR EMAIL_USER FROM .env
      pass: process.env.EMAIL_PASS, // <-- USE YOUR EMAIL_PASS FROM .env
    },
  });

  let mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_USER, // You can send it to your own email address
    subject: `New contact form submission: ${subject}`,
    html: `
      <h2>New Message from Ethereal Jewels Website</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    req.flash("success", "Your message has been sent successfully!");
    res.redirect("/contact");
  } catch (error) {
    console.error("Error sending email:", error);
    req.flash("error", "There was an error sending your message. Please try again.");
    res.redirect("/contact");
  }
});

app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  // res.status(statusCode).render('error',{err})
  res.send(err.message);
});

const port = 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});