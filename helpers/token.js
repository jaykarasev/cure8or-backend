const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * Generates a signed JWT token for user authentication.
 *
 * @param {Object} user - User object containing `id`, `username`, and `isAdmin`
 * @returns {string} JWT token
 */
function createToken(user) {
  console.assert(
    user.id !== undefined,
    "createToken passed user without an ID"
  );

  let payload = {
    id: user.id,
    isAdmin: user.isAdmin || false, // Keep isAdmin for future admin roles
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" }); // Expires in 1 hour
}

module.exports = { createToken };
