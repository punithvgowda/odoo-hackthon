const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const User = require("./schema.js");
const session = require("express-session");
const flash = require("connect-flash");

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
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
app.use(session({
  secret: "yourSecretKey", // replace with a secure secret
  resave: false,
  saveUninitialized: true
}));

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

// Home page
app.get("/", (req, res) => {
  res.render("index"); // user info available in EJS via res.locals.user
});

app.get("/home", (req, res) => {
  res.render("index");
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

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

    // Save login timestamp
    existingUser.loginHistory.push(new Date());
    await existingUser.save();

    // Set session
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

    // Set session
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
  req.session.destroy(err => {
         
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
