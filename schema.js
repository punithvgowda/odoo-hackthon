const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  confirmpassword: String,
  location: String,
});

// Create a model
const User = mongoose.model("User", userSchema);

module.exports = User;
