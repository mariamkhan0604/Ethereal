const express = require("express");
const app = express();
const path = require("path");
const engine = require("ejs-mate");

app.use(express.json());
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));
app.use(express.static(path.join(__dirname, "../frontend/public")));

app.get("/", (req, res) => {
  res.render("home");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
