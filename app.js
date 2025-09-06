const express = require("express");
const app = express();
const path = require("path");
const mongoose=require("mongoose");
const User = require("./schema.js"); 
const session = require("express-session");
const flash = require("connect-flash");

app.use(session({
  secret: "yourSecretKey", // change this to something secure
  resave: false,
  saveUninitialized: true
}));

// Flash middleware
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});
let port = 3000;

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public"), {
    etag: false,
    maxAge: 0
}));
 //database

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/reneweddb");
}

main()
  .then(() => console.log("✅ Connection successful"))
  .catch((err) => console.log("❌ Connection failed:", err));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Custom middleware (runs on every request)
app.use((req, res, next) => {
    console.log("Middleware executed for every call");
    next();
});

// Routes
app.get("/", (req, res) => {
    res.render("index");  // views/index.ejs
});
app.get("/home",(req,res)=>{
    res.render("index");
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.get("/signup",(req,res)=>{
    res.render("signup")
})
app.post("/login",async(req,res)=>{
    
   
    try {
    const { email, password } = req.body;
        console.log(req.body);
    // Check if email exists in DB
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      req.flash("error_msg", "Email not registered. Please sign up.");
      return res.redirect("/signup");
    }

    // Check if password matches
    if (existingUser.password !== password) {
        req.flash("error_msg", "Incorrect password. Try again.");
      return res.redirect("/login");
    }

   req.flash("success_msg", "Login successful!");
     return res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong!");
  }
})
app.post("/signup", async(req,res)=>{
      try {
        console.log("post request");
    // Take data from req.body
    const { name, email, password, confirmpassword, location } = req.body;
        console.log(req.body);
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      confirmpassword,
      location,
    });

    // Save in DB
    await newUser.save();
 req.flash("success_msg", "Welcome To ReNewed ");
   res.redirect("/home");
  } catch (err) {
    console.error("❌ Error saving user:", err);
    res.status(500).send("Something went wrong!");
  }
   
  
})

// Start server
app.listen(port, () => {
    console.log(`Project is live on http://localhost:${port}`);
});
