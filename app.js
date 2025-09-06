const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const { User, Product } = require("./schema"); // Make sure both are exported from schema.js

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"), { etag: false, maxAge: 0 }));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===== DATABASE =====
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/reneweddb");
}
main()
  .then(() => console.log("✅ Connection successful"))
  .catch((err) => console.log("❌ Connection failed:", err));

// ===== SESSION & FLASH =====
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// Make flash messages and user info available in all views
app.use(async (req, res, next) => {
  res.locals.success_msg = req.flash("success_msg") || [];
  res.locals.error_msg = req.flash("error_msg") || [];

  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.user = user || null;
    } catch (err) {
      console.error(err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }

  next();
});

// ===== ROUTES =====

// Redirect root to /home
app.get("/", (req, res) => res.redirect("/home"));

// Home page - fetch products
app.get("/home", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("index", { products });
  } catch (err) {
    console.error(err);
    res.render("index", { products: [] });
  }
});

// Show new product form
app.get("/new", (req, res) => {
  res.render("new");
});

// POST new product - save and redirect
app.post("/new", async (req, res) => {
  try {
    const { name, description, image, price, location, donating } = req.body;

    const newProduct = new Product({
      name,
      description,
      image,
      price,
      location,
      donating,
    });

    await newProduct.save();
    req.flash("success_msg", "Product added successfully!");
    res.redirect("/home"); // PRG pattern: redirect to prevent duplicate POST
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error adding product!");
    res.redirect("/new");
  }
});

// Login page
app.get("/login", (req, res) => res.render("login"));

// Signup page
app.get("/signup", (req, res) => res.render("signup"));

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      req.flash("error_msg", "Email not registered. Please sign up.");
      return res.redirect("/signup");
    }

    if (existingUser.password !== password) {
      req.flash("error_msg", "Incorrect password.");
      return res.redirect("/login");
    }

    existingUser.loginHistory.push(new Date());
    await existingUser.save();

    req.session.userId = existingUser._id;
    req.flash("success_msg", "Login successful!");
    return res.redirect("/home");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong!");
    return res.redirect("/login");
  }
});

// ===== SIGNUP =====
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmpassword, location } = req.body;
    const newUser = new User({ name, email, password, confirmpassword, location });

    await newUser.save();
    req.session.userId = newUser._id;

    req.flash("success_msg", "Signup successful!");
    return res.redirect("/home");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error saving user!");
    return res.redirect("/signup");
  }
});

// ===== LOGOUT =====
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/home");
  });
});

// ===== PROFILE =====
app.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/home");
    }
    res.render("profile", { user });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong");
    return res.redirect("/home");
  }
});

// ===== START SERVER =====
const port = 3000;
app.listen(port, () => {
  console.log(`Project is live on http://localhost:${port}`);
});
