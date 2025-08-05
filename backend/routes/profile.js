const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const { isLoggedIn } = require("../utils/middleware.js");

// Get user profile
router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/shop");
    }
    res.render("profile", { user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    req.flash("error", "Failed to load profile.");
    res.redirect("/shop");
  }
});

// Show Edit Profile Page
router.get("/profile/edit", isLoggedIn, (req, res) => {
  res.render("profile_edit", { currentUser: req.session.user });
});

// Handle Profile Update
// POST /profile/edit
// Handle Profile Update
router.post("/profile/edit", isLoggedIn, async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        email,
        phone,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      req.flash("error", "User not found.");
      return res.redirect("/profile");
    }

    // ✅ Update the session manually to reflect the changes immediately
    req.session.user = {
      _id: updatedUser._id,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      email: updatedUser.email,
      phone: updatedUser.phone || "",
      isAdmin: updatedUser.isAdmin,
    };

    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
  } catch (err) {
    console.error("Update error:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/profile/edit");
  }
});

module.exports = router;
