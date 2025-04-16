"use strict";

// Import Playlist model and db connection
const Playlist = require("./Playlist");
const db = require("../db");
const { NotFoundError } = require("../expressError");

// Import test setup utilities and shared test data
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds,
} = require("./_testCommon");

// Setup database state for all tests and individual runs
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("Playlist model", function () {
  test("can create playlist", async function () {
    // Test that a playlist can be created and returns expected fields
    const newPlaylist = await Playlist.create({
      name: "Test Playlist 2",
      description: "Another test playlist",
      ownerId: testUserIds[0],
      isPrivate: false,
      password: null,
      imageUrl: "http://example.com/image.png",
    });

    expect(newPlaylist).toHaveProperty("id");
    expect(newPlaylist.name).toBe("Test Playlist 2");
    expect(newPlaylist.ownerId).toBe(testUserIds[0]);
  });

  test("can find all playlists", async function () {
    // Verifies that findAll returns an array of playlists
    const playlists = await Playlist.findAll();

    expect(Array.isArray(playlists)).toBe(true);
    expect(playlists.length).toBeGreaterThan(0);
    expect(playlists[0]).toHaveProperty("name");
    expect(playlists[0]).toHaveProperty("ownerUsername");
  });

  test("can get playlist (public or unlocked)", async function () {
    // Confirms that an existing playlist can be retrieved with full details
    const playlist = await Playlist.get(testPlaylistIds[0], testUserIds[0]);

    expect(playlist).toHaveProperty("id");
    expect(playlist).toHaveProperty("songs");
    expect(playlist.name).toBe("Chill Vibes");
  });

  test("throws NotFoundError on missing playlist", async function () {
    // Ensures that trying to retrieve a nonexistent playlist throws NotFoundError
    try {
      await Playlist.get(999999, testUserIds[0]);
      throw new Error("should not reach this line");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("can update playlist", async function () {
    // Verifies that an existing playlist can be updated and changes are returned
    const updated = await Playlist.update(testPlaylistIds[0], {
      name: "Updated Playlist",
      description: "New Desc",
      imageUrl: null,
    });

    expect(updated.name).toBe("Updated Playlist");
    expect(updated.description).toBe("New Desc");
    expect(updated.id).toBe(testPlaylistIds[0]);
  });

  test("can delete playlist", async function () {
    // Confirms that a newly created playlist can be deleted and is no longer retrievable
    const created = await Playlist.create({
      name: "To Delete",
      description: "Will be deleted",
      ownerId: testUserIds[0],
      isPrivate: false,
      password: null,
      imageUrl: null,
    });

    await Playlist.remove(created.id);

    try {
      await Playlist.get(created.id, testUserIds[0]);
      throw new Error("should not reach this line");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
