function getUserByEmail(email, database) {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }

  return undefined;
}

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
      result[shorturl] = database[shorturl].longURL;
    }
  }
  return result;
}

module.exports = { generateRandomString, urlsForUser, getUserByEmail };
