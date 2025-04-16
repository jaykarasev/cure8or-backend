// users.test.js
"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/User");

let userToken;
let userId;

// Setup: Connect to DB, clear users, register a user and obtain auth token
beforeAll(async () => {
  await db.connect();
  await db.query("DELETE FROM users");

  const newUser = await User.register({
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "password",
    imageUrl: "http://example.com/image.png",
  });

  userId = newUser.id;

  const loginResp = await request(app).post("/auth/token").send({
    identifier: "testuser",
    password: "password",
  });

  userToken = loginResp.body.token;
});

// Teardown: Clear users and close DB connection
afterAll(async () => {
  await db.query("DELETE FROM users");
  await db.end();
});

describe("Users Routes", () => {
  // Test: Retrieves all users in the system with valid auth token
  test("GET /users - returns all users", async () => {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${userToken}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.users).toBeInstanceOf(Array);
    expect(resp.body.users[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      })
    );
  });

  // Test: Retrieves a specific user by ID with valid auth token
  test("GET /users/:id - returns user by ID", async () => {
    const resp = await request(app)
      .get(`/users/${userId}`)
      .set("authorization", `Bearer ${userToken}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.user).toEqual({
      id: userId,
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      imageUrl: "http://example.com/image.png",
      createdAt: expect.any(String),
      playlists: expect.any(Array),
      accessPlaylists: expect.any(Array),
    });
  });

  // Test: Successfully updates user's first and last name with correct password and auth
  test("PATCH /users/:id - updates user's name", async () => {
    const resp = await request(app)
      .patch(`/users/${userId}`)
      .send({
        firstName: "Updated",
        lastName: "User",
        email: "test@example.com",
        password: "password",
      })
      .set("authorization", `Bearer ${userToken}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.user.firstName).toBe("Updated");
  });

  // Test: Deletes the user account for the given ID with valid auth token
  test("DELETE /users/:id - deletes the user", async () => {
    const resp = await request(app)
      .delete(`/users/${userId}`)
      .set("authorization", `Bearer ${userToken}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ deleted: String(userId) });
  });
});
