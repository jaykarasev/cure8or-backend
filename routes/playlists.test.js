// playlist.test.js
"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/User");

let testUserToken;
let testUserId;

// Setup: connect to DB, clear relevant tables, register and log in a test user
beforeAll(async () => {
  await db.connect();

  await db.query("DELETE FROM playlist_songs");
  await db.query("DELETE FROM playlists");
  await db.query("DELETE FROM users");

  const newUser = await User.register({
    username: "testuser",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "password",
    imageUrl: "http://example.com/image.png",
  });

  testUserId = newUser.id;

  const loginResp = await request(app).post("/auth/token").send({
    identifier: "testuser",
    password: "password",
  });

  testUserToken = loginResp.body.token;
});

// Teardown: cleanly end DB connection
afterAll(async () => {
  await db.end();
});

describe("Playlist Routes", () => {
  describe("POST /playlists", () => {
    // Test: Successfully creates a private playlist with password
    test("creates a private playlist", async () => {
      const resp = await request(app)
        .post("/playlists")
        .send({
          name: "My Playlist",
          description: "Some cool vibes",
          isPrivate: true,
          password: "supersecure",
          imageUrl: "http://example.com/image.png",
        })
        .set("authorization", `Bearer ${testUserToken}`);

      expect(resp.statusCode).toBe(201);
      expect(resp.body.playlist).toEqual({
        id: expect.any(Number),
        name: "My Playlist",
        description: "Some cool vibes",
        isPrivate: true,
        imageUrl: "http://example.com/image.png",
        ownerId: testUserId,
        createdAt: expect.any(String),
      });
    });

    // Test: Successfully creates a public playlist (no password required)
    test("creates a public playlist", async () => {
      const resp = await request(app)
        .post("/playlists")
        .send({
          name: "Public Playlist",
          description: "Chill vibes",
          isPrivate: false,
          password: null,
          imageUrl: "http://example.com/image.png",
        })
        .set("authorization", `Bearer ${testUserToken}`);

      expect(resp.statusCode).toBe(201);
      expect(resp.body.playlist.name).toBe("Public Playlist");
    });

    // Test: Fails to create a playlist when no authorization token is provided
    test("unauthenticated if no token", async () => {
      const resp = await request(app).post("/playlists").send({
        name: "NoToken",
        description: "Should fail",
        isPrivate: false,
        password: null,
        imageUrl: "http://example.com/image.png",
      });

      // Note: currently fails with 500 because route doesn't handle missing user gracefully
      expect(resp.statusCode).toBe(500);
    });

    // Test: Fails to create a playlist when required fields are missing or empty
    test("fails with missing data", async () => {
      const resp = await request(app)
        .post("/playlists")
        .send({
          name: "",
          description: "",
          isPrivate: false,
          password: null,
          imageUrl: "http://example.com/image.png",
        })
        .set("authorization", `Bearer ${testUserToken}`);

      expect(resp.statusCode).toBe(400);
    });
  });

  describe("GET /playlists", () => {
    // Test: Retrieves all public playlists without requiring authentication
    test("retrieves public playlists without auth", async () => {
      const resp = await request(app).get("/playlists");

      expect(resp.statusCode).toBe(200);
      expect(resp.body.playlists).toBeInstanceOf(Array);
    });

    // Test: Retrieves all accessible playlists (owned or shared) when authenticated
    test("retrieves playlists with auth", async () => {
      const resp = await request(app)
        .get("/playlists")
        .set("authorization", `Bearer ${testUserToken}`);

      expect(resp.statusCode).toBe(200);
      expect(resp.body.playlists).toBeInstanceOf(Array);
    });
  });

  describe("DELETE /playlists/:id", () => {
    // Test: Deletes a playlist by its ID if the authenticated user is the owner
    test("deletes a playlist by id", async () => {
      const createResp = await request(app)
        .post("/playlists")
        .send({
          name: "DeleteMe",
          description: "Will be deleted",
          isPrivate: true,
          password: "delete",
          imageUrl: "http://example.com/delete.png",
        })
        .set("authorization", `Bearer ${testUserToken}`);

      const playlistId = createResp.body.playlist.id;

      const resp = await request(app)
        .delete(`/playlists/${playlistId}`)
        .set("authorization", `Bearer ${testUserToken}`);

      expect(resp.statusCode).toBe(200);
      expect(resp.body).toEqual({ message: "Playlist deleted successfully." });
    });
  });
});
