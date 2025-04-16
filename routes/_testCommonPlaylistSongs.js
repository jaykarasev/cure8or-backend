// _testCommonPlaylistSongs.js
const db = require("../db");

// This hook runs once before all tests that import this file.
// It ensures a connection to the test database is established before tests run.
beforeAll(async () => {
  await db.connect();
});

// This hook runs once after all tests that import this file are complete.
// It cleanly closes the database connection to avoid open handles and resource leaks.
afterAll(async () => {
  await db.end();
});
