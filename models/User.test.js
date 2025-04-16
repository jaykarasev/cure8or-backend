"use strict";

// Import the User model and database connection
const User = require("./User");
const db = require("../db");
const { NotFoundError } = require("../expressError");

// Import shared test lifecycle methods and seed data
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds, // Seeded user IDs from _testCommon for consistent referencing
} = require("./_testCommon");

// Run once before all tests in this file — sets up test DB state
beforeAll(commonBeforeAll);

// Run before each test — starts a transaction
beforeEach(commonBeforeEach);

// Roll back transaction after each test to reset DB state
afterEach(commonAfterEach);

// Run once after all tests — closes DB connection
afterAll(commonAfterAll);

describe("User model", function () {
  test("can get user with playlists and accessPlaylists", async function () {
    // Verifies User.get() returns the correct structure, including:
    // - the user's basic info
    // - their owned playlists
    // - playlists they have access to
    const user = await User.get(testUserIds[0]);
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("playlists");
    expect(user).toHaveProperty("accessPlaylists");
  });

  test("can update user fields", async function () {
    // Tests User.update() correctly updates fields like username and email
    // Confirms returned object reflects updated values
    const updated = await User.update(testUserIds[0], {
      username: "updatedUser",
      email: "updated@example.com",
      imageUrl: null,
    });

    expect(updated.username).toBe("updatedUser");
    expect(updated.email).toBe("updated@example.com");
  });

  test("can remove user", async function () {
    // Tests User.remove() successfully deletes a user by ID
    // Then tries to fetch the same user to confirm they no longer exist
    await User.remove(testUserIds[0]);

    try {
      await User.get(testUserIds[0]);
      fail(); // Forces failure if no error is thrown
    } catch (err) {
      // Confirms error is a NotFoundError as expected
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
