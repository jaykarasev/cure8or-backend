const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * Generates a signed JWT token for user authentication.
 *
 * @param {Object} user - User object containing `id`, `username`, and `isAdmin`
 * @returns {string} JWT token
 */
function createToken(user) {
  const payload = {
    id: user.id,
    isAdmin: user.isAdmin || false, // Keep isAdmin for future admin roles
  };

  if (!payload) throw new Error("JWT signing failed — payload was undefined.");

  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" }); // 1 hour expiration
}

module.exports = { createToken };
