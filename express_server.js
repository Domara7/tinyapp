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
  const templateVars = { 
    urls: urlDatabase, 
    username: req.cookies["username"] 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {  
    username: req.cookies["username"] 
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
  res.cookie("username", userName)
  res.redirect("/urls")
});



