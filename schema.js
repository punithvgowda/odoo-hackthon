const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  confirmpassword: String,
  location: String,
  loginHistory: [
    {
      type: Date,
      default: Date.now
    }
  ]
});



const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  price: Number,
  location: String,
  donating: String
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);

// Export both
module.exports = { User, Product };