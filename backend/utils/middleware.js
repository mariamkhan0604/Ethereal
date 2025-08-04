// Corrected middleware.js
module.exports.isLoggedIn = function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "You must be signed in.");
    return res.redirect("/auth/login");
  }
  req.user = req.session.user;
  next();
};

module.exports.isAdmin = function isAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    req.flash("error", "You do not have permission to view this page.");
    return res.redirect("/shop");
  }
};
