// auth.test.js
"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/User");

jest.setTimeout(20000);

// Setup: Connect to test DB and insert one test user
beforeAll(async () => {
  await db.connect();
  await db.query("DELETE FROM users");

  await User.register({
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "password",
    imageUrl: "http://example.com/image.png",
  });
});

// Teardown: Clean up test DB
afterAll(async () => {
  await db.query("DELETE FROM users");
  await db.end();
});

describe("Auth Routes", () => {
  describe("POST /auth/register", () => {
    // Test: Successfully registering a new user with all required fields
    test("successfully registers a new user", async () => {
      const resp = await request(app).post("/auth/register").send({
        username: "newuser",
        firstName: "New",
        lastName: "User",
        email: "newuser@example.com",
        password: "password123",
        imageUrl: "http://example.com/image.png",
      });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          username: "newuser",
          firstName: "New",
          lastName: "User",
          email: "newuser@example.com",
          imageUrl: "http://example.com/image.png",
          createdAt: expect.any(String),
        },
      });
    });

    // Test: Registration fails when required fields are missing
    test("fails with missing fields", async () => {
      const resp = await request(app).post("/auth/register").send({
        username: "incomplete",
      });
      expect(resp.statusCode).toBe(400);
    });

    // Test: Registration fails when email is not in a valid format
    test("fails with invalid email", async () => {
      const resp = await request(app).post("/auth/register").send({
        username: "bademail",
        firstName: "Bad",
        lastName: "Email",
        email: "not-an-email",
        password: "password123",
        imageUrl: "http://example.com/image.png",
      });
      expect(resp.statusCode).toBe(400);
    });
  });

  describe("POST /auth/token", () => {
    // Test: Successfully logs in using a valid username and correct password
    test("logs in with valid username", async () => {
      const resp = await request(app).post("/auth/token").send({
        identifier: "testuser",
        password: "password",
      });

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          username: "testuser",
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
        },
      });
    });

    // Test: Successfully logs in using a valid email and correct password
    test("logs in with valid email", async () => {
      const resp = await request(app).post("/auth/token").send({
        identifier: "test@example.com",
        password: "password",
      });

      expect(resp.statusCode).toBe(200);
      expect(resp.body.token).toEqual(expect.any(String));
    });

    // Test: Fails to log in when using a valid identifier but incorrect password
    test("fails with wrong password", async () => {
      const resp = await request(app).post("/auth/token").send({
        identifier: "testuser",
        password: "wrongpassword",
      });
      expect(resp.statusCode).toBe(401);
    });

    // Test: Fails to log in when the identifier does not match any user
    test("fails with invalid identifier", async () => {
      const resp = await request(app).post("/auth/token").send({
        identifier: "nosuchuser",
        password: "password",
      });
      expect(resp.statusCode).toBe(401);
    });

    // Test: Fails to log in when required fields are missing from the request
    test("fails with missing fields", async () => {
      const resp = await request(app).post("/auth/token").send({});
      expect(resp.statusCode).toBe(400);
    });
  });
});
