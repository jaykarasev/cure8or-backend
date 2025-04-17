"use strict";
require("dotenv").config();

const app = require("./app");
const db = require("./db"); // Import the db
const { PORT } = require("./config");

(async function startServer() {
  try {
    await db.connect(); // Connect to the database first
    app.listen(PORT, function () {
      if (process.env.NODE_ENV !== "production") {
        console.log(`Cure8or running on http://localhost:${PORT}`);
      }
    });
  } catch (err) {
    console.error("❌ Error connecting to database:", err);
    process.exit(1); // Exit if DB connection fails
  }
})();
