"use strict";
require("dotenv").config();
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const PORT = +process.env.PORT || 3001;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3001/callback";

function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? "postgresql://localhost/cure8or_test"
    : process.env.DATABASE_URL || "postgresql://localhost/cure8or";
}

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

// ✅ Safe logging only in development
if (process.env.NODE_ENV !== "production") {
  console.log("Cure8or Config:".green);
  console.log("ENV:".yellow, process.env.NODE_ENV);
  console.log("PORT:".yellow, PORT.toString());
  // Optional: console.log("Database URI:", getDatabaseUri()); ← Only show if needed
}

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
};
