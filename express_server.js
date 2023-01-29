const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers");

const { urlDatabase, users } = require("./database");
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["123"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.get("/", (req, res) => {
  const userId = req.session["user_id"];
  const user = users[userId];

  if (user) {
    res.redirect("/urls");
  }

  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];

  if (!userId) return res.redirect("/login");

  const userObject = users[userId];

  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user: userObject,
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  const userObject = users[userId];

  if (!userObject) {
    return res.redirect("/login");
  }

  const templateVars = {
    user: userObject,
  };

  return res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session["user_id"];
  const usersUrls = urlsForUser(userId, urlDatabase);
  const shortUrl = req.params.id;
  const longURL = urlDatabase[shortUrl].longURL;
  const user = users[userId];
  const templateVars = { id: shortUrl, longURL, user };
  if (!userId) {
    return res.send("<html>User must be logged in to see the URLS</html>");
  }

  if (!urlDatabase[shortUrl]) {
    return res.send("<html>This shortUrl does not exist</html>");
  }

  if (!usersUrls[shortUrl]) {
    return res.send("<html>This URL does not belong to you</html>");
  }

  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const shortUrl = generateRandomString(6);
  const longURL = req.body.longURL;

  if (!userID) {
    return res.send("<html>User must be logged in to shorten URLS</html>");
  }

  if (longURL.length === 0) {
    return res.send("You must submit a proper URL");
  }

  urlDatabase[shortUrl] = { longURL, userID };

  return res.redirect(`/urls`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;

  if (!urlDatabase[id]) {
    return res.send("<html>This Id is not in the database</html>");
  }

  res.redirect(longURL);
});

// delete short and long
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session["user_id"];
  const usersUrls = urlsForUser(userId, urlDatabase);
  const shortUrl = req.params.id;

  if (!userId) {
    return res.send("<html>User must be logged in to see the URLS</html>");
  }

  if (!urlDatabase[shortUrl]) {
    return res.send("<html>This shortUrl does not exist</html>");
  }

  if (!usersUrls[shortUrl]) {
    return res.send("<html>This URL does not belong to you</html>");
  }

  delete urlDatabase[shortUrl];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session["user_id"];
  const usersUrls = urlsForUser(userId, urlDatabase);
  const shortUrl = req.params.id;
  if (!userId) {
    return res.send("<html>User must be logged in to see the URLS</html>");
  }

  if (!urlDatabase[shortUrl]) {
    return res.send("<html>This shortUrl does not exist</html>");
  }

  if (urlDatabase[shortUrl].userID !== userId) {
    return res.send("<html>This URL does not belong to you</html>");
  }

  urlDatabase[shortUrl].longURL = req.body.LongUrl;
  res.redirect("/urls");
});

// login routes
app.get("/login", (req, res) => {
  const userId = req.session["user_id"];
  const userObject = users[userId];
  if (userObject) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: userObject,
  };
  return res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send({ Message: "Email has not been registered" });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res
      .status(403)
      .send({ Message: "Password does not match this email" });
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// register routes
app.get("/register", (req, res) => {
  const userId = req.session["user_id"];
  const userObject = users[userId];
  if (userObject) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: userObject,
  };
  return res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;

  if (email === "" || password === "") {
    return res.send(
      400,
      "You will need to fill in the following password or username."
    );
  }

  const user = getUserByEmail(email, users);

  if (user) {
    return res.send(400, "An account with this email is already registered.");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString(6);

  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  req.session.user_id = userId;
  res.redirect("/urls");
});

// logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
