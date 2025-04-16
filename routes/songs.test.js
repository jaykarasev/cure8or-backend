// songs.test.js
"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Song = require("../models/Song");

let testSong;

// Setup: Connect to DB, clear songs table, insert one test song
beforeAll(async () => {
  await db.connect();
  await db.query("DELETE FROM songs");

  testSong = await Song.create({
    spotifyId: "test-spotify-id",
    title: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    duration: 210000,
    previewUrl: "http://example.com/preview",
    imageUrl: "http://example.com/image.png",
  });
});

// Teardown: Clear songs table and close DB connection
afterAll(async () => {
  await db.query("DELETE FROM songs");
  await db.end();
});

describe("Songs Routes", () => {
  describe("POST /songs", () => {
    // Test: Successfully creates a new song when all required fields are provided
    test("creates a new song", async () => {
      const resp = await request(app).post("/songs").send({
        spotifyId: "another-id",
        title: "Another Song",
        artist: "Another Artist",
        album: "Another Album",
        duration: 180000,
        previewUrl: "http://example.com/preview2",
        imageUrl: "http://example.com/image2.png",
      });

      expect(resp.statusCode).toBe(201);
      expect(resp.body.song).toEqual({
        id: expect.any(Number),
        spotifyId: "another-id",
        title: "Another Song",
        artist: "Another Artist",
        album: "Another Album",
        duration: 180000,
        previewUrl: "http://example.com/preview2",
        imageUrl: "http://example.com/image2.png",
      });
    });

    // Test: Fails to create a song when required fields are missing
    test("fails with missing required fields", async () => {
      const resp = await request(app).post("/songs").send({
        title: "Incomplete Song", // Missing artist, album, etc.
      });

      expect(resp.statusCode).toBe(400);
    });
  });

  describe("GET /songs", () => {
    // Test: Successfully retrieves a list of all songs in the database
    test("retrieves all songs", async () => {
      const resp = await request(app).get("/songs");

      expect(resp.statusCode).toBe(200);
      expect(resp.body.songs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /songs/:id", () => {
    // Test: Successfully retrieves a single song by its ID
    test("retrieves a specific song by ID", async () => {
      const resp = await request(app).get(`/songs/${testSong.id}`);

      expect(resp.statusCode).toBe(200);
      expect(resp.body.song).toEqual({
        id: testSong.id,
        spotifyId: "test-spotify-id",
        title: "Test Song",
        artist: "Test Artist",
        album: "Test Album",
        duration: 210000,
        previewUrl: "http://example.com/preview",
        imageUrl: "http://example.com/image.png",
        spotifyUrl: null, // Optional field defaults to null
      });
    });

    // Test: Returns 404 when trying to retrieve a song with an invalid or non-existent ID
    test("returns 404 for invalid song ID", async () => {
      const resp = await request(app).get(`/songs/999999`);
      expect(resp.statusCode).toBe(404);
    });
  });
});
