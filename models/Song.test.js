// TEST FILE: models/Song.test.js

"use strict";

// Import Song model and database connection
const Song = require("./Song");
const db = require("../db");
const { BadRequestError } = require("../expressError");

// Import shared test hooks
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

// Setup and teardown hooks to manage DB state for consistent tests
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Song model", function () {
  test("can find or create by Spotify ID", async function () {
    // Verifies that a new song can be created when it doesn't already exist
    const result = await Song.findOrCreateBySpotifyId({
      spotifyId: "spotify_test_id",
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      previewUrl: "http://example.com/preview.mp3",
      imageUrl: "http://example.com/image.jpg",
    });

    expect(result).toHaveProperty("id");

    // Verifies the song is properly stored in the DB with correct details
    const songFromDb = await Song.get(result.id);
    expect(songFromDb.spotifyId).toBe("spotify_test_id");
    expect(songFromDb.title).toBe("Test Song");
  });

  test("returns existing song on duplicate Spotify ID", async function () {
    // First insert should create a new song
    const first = await Song.findOrCreateBySpotifyId({
      spotifyId: "dup_id",
      title: "Dup Song",
      artist: "Dup Artist",
      album: "Dup Album",
      previewUrl: null,
      imageUrl: null,
    });

    // Second insert with same Spotify ID should not create a new song
    const second = await Song.findOrCreateBySpotifyId({
      spotifyId: "dup_id",
      title: "Another Title", // these fields should be ignored
      artist: "Another Artist",
      album: "Another Album",
      previewUrl: null,
      imageUrl: null,
    });

    expect(second.id).toBe(first.id); // same song returned by ID

    // Check that original song data remains unchanged
    const songFromDb = await Song.get(second.id);
    expect(songFromDb.spotifyId).toBe("dup_id");
    expect(songFromDb.title).toBe("Dup Song"); // title should not be overwritten
  });
});
