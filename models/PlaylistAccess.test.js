"use strict";

// Import PlaylistAccess model and database connection
const PlaylistAccess = require("./PlaylistAccess");
const db = require("../db");

// Import shared test setup and seeded test data
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds,
} = require("./_testCommon");

// Setup the database state before/after all tests and each individual test
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("PlaylistAccess model", function () {
  test("can grant access", async function () {
    // Ensures that calling grantAccess inserts a row into playlist_access table
    await PlaylistAccess.grantAccess(testUserIds[0], testPlaylistIds[0]);

    const result = await db.query(
      `SELECT * FROM playlist_access WHERE user_id=$1 AND playlist_id=$2`,
      [testUserIds[0], testPlaylistIds[0]]
    );

    expect(result.rows.length).toBe(1); // Expect the record to exist
  });

  test("can check access", async function () {
    // After granting access, confirms that hasAccess returns true
    await PlaylistAccess.grantAccess(testUserIds[0], testPlaylistIds[0]);

    const hasAccess = await PlaylistAccess.hasAccess(
      testUserIds[0],
      testPlaylistIds[0]
    );

    expect(hasAccess).toBe(true); // Access should be granted
  });

  test("denies access if not granted", async function () {
    // If no access has been granted, hasAccess should return false
    const hasAccess = await PlaylistAccess.hasAccess(999, testPlaylistIds[0]);

    expect(hasAccess).toBe(false); // No record should exist
  });
});
