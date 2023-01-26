const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
const users = {};
const getUserByEmail = require("./helpers");

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

function generateRandomString(length) {
  let result = "";
  const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const lengthOf = character.length;

  for (let i = 0; i < length; i++) {
    result += character.charAt(Math.floor(Math.random() * lengthOf));
  }
  return result;
}

function urlsForUser(id, database) {
  const result = {};
  for (const shorturl in database) {
    if (database[shorturl].userID === id) {
      result[shorturl] = database[shorturl];
    }
  }
  return result;
}

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  if (!userId) return res.redirect("/login");
  const userObject = users[userId];
  const templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    userId,
    user: userObject,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  const userObject = users[userId];
  const templateVars = {
    user: userObject,
    userId,
  };
  if (!userObject) {
    res.redirect("/login");
  }
  return res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session["user_id"];
  const usersUrls = urlsForUser(userId);
  const id = req.params.id;
  if (!userId) {
    return res.send("<html>User must be logged in to see the URLS</html>");
  }

  if (urlDatabase[id]) {
    return res.send("<html>This shortUrl does not exist</html>");
  }

  if (!usersUrls[id]) {
    return res.send("<html>This URL does not belong to you</html>");
  }

  const shortUrl = req.params.id;
  const longURL = urlDatabase[shortUrl].longURL;
  const templateVars = { id: shortUrl, longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];

  if (!userId) {
    return res.send("<html>User must be logged in to shorten URLS</html>");
  }
  const shortUrl = generateRandomString(6);
  const longUrl = req.body.longURL;

  urlDatabase[shortUrl] = { longURL: longUrl, userID: userId };

  return res.redirect(`/urls`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (!id) {
    return res.send("<html>This Id is not in the data base</html>");
  }
  res.redirect(longURL);
});
// delete short and long
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session["user_id"];
  const usersUrls = urlsForUser(userId);
  const id = req.params.id;
  if (!userId) {
    return res.send("<html>User must be logged in to see the URLS</html>");
  }

  if (urlDatabase[id]) {
    return res.send("<html>This shortUrl does not exist</html>");
  }

  if (!usersUrls[id]) {
    return res.send("<html>This URL does not belong to you</html>");
  }

  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session["user_id"];
  const usersUrls = urlsForUser(userId, urlDatabase);
  const id = req.params.id;
  if (!userId) {
    return res.send("<html>User must be logged in to see the URLS</html>");
  }

  if (urlDatabase[id]) {
    return res.send("<html>This shortUrl does not exist</html>");
  }

  if (urlDatabase[id].userID !== userId) {
    return res.send("<html>This URL does not belong to you</html>");
  }

  urlDatabase[id] = req.body.LongUrl;
  res.redirect("/urls");
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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const userId = req.session["user_id"];
  const userObject = users[userId];
  if (userObject) {
    return res.redirect("/urls");
  }
  return res.render("register");
});

app.post("/register", (req, res) => {
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const email = req.body.email;

  if (email === "" || password === "") {
    res.send(
      400,
      "You will need to fill in the following password or username."
    );
    return;
  }
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      res.send(400, "An account with this email is already registered.");
      return;
    }
  }
  const userId = generateRandomString(6);

  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  req.session.user_id = userId;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userId = req.session["user_id"];
  const userObject = users[userId];
  if (userObject) {
    return res.redirect("/urls");
  }
  return res.render("login");
});
