const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString (length) {
  let result = "";
  const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const lengthOf = character.length;

  for (let i = 0; i < length; i++) {
    result += character.charAt(Math.floor(Math.random() * lengthOf));
  }
  return result;

};

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

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
  const userId = req.cookies["user_id"]
  const userObject = users[userId]
  const templateVars = { 
    urls: urlDatabase, 
    user: userObject
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"]
  const userObject = users[userId]
  const templateVars = {  
    user: userObject
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const shortUrl = req.params.id
  const longURL = urlDatabase[shortUrl]
  const templateVars = { id: shortUrl, longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  const shortUrl = generateRandomString(6)
  const longUrl = req.body.longURL
  urlDatabase[shortUrl] = longUrl

  res.redirect(`/urls/${shortUrl}`)
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id
  const longURL = urlDatabase[id]
  res.redirect(longURL);
});
// delete short and long 
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id
  delete urlDatabase[id]
  res.redirect("/urls")
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id
  urlDatabase[id] = req.body.LongUrl
  res.redirect("/urls")
});

app.post("/login", (req, res) => { 
  const userName = req.body.username
  res.cookie("user_id", userName)
  res.redirect("/urls")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/register")
});

app.get("/register", (req, res) => {
  res.render("register")
});

app.post("/register", (req, res) => {
  
  const email = req.body.email
  const password = req.body.password
  
  if (email === ""|| password === "") {
    res.send(400, "You will need to fill in the following password or username.")
    return
  }
  for(const userId in users) {
    const user = users[userId]
    if (user.email === email){
      res.send(400, "An account with this email is already registered.")
    return
    }
  }
  const userId = generateRandomString(6)
  
  users[userId] = {
    id: userId,
    email,
    password
  }
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

