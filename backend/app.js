require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const engine = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const Product=require('./models/Product');
const user=require('./models/User');
const flash=require('connect-flash');
const ExpressError = require('./utils/ExpressError');
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

console.log("MongoDB URL:", process.env.DATABASE_URL); // Debug line

mongoose.connect(process.env.DATABASE_URL)
.then(() => console.log("Connected to MongoDB", mongoose.connection.host))
.catch(err => {
  console.error("MongoDB connection failed:");
  console.error(err.message); // cleaner output
  process.exit(1); // Optional: Exit app on DB failure
});

app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

const sessionConfig = {
  secret: process.env.SESSION_SECRET ,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  }
};
app.use(session(sessionConfig));
app.use(flash());
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user ;
  res.locals.success=req.flash('success');
  res.locals.error=req.flash('error');
  next();
});
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes); 
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});
app.get('/shop',async(req,res)=>{
  const products = await Product.find({});
  res.render('shop',{products});
})

app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err,req,res,next)=>{
    const {statusCode=500}=err;
    if(!err.message) err.message="Something went wrong";
    // res.status(statusCode).render('error',{err})
    res.send(err.message);
})

const port = 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
