module.exports = function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "You must be signed in.");
    return res.redirect("/auth/login");
  }
  req.user = req.session.user; 
  next();
};
