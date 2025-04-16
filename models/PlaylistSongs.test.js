"use strict";

// Import dependencies
const db = require("../db");
const PlaylistSongs = require("./PlaylistSongs");
const spotifyApi = require("../spotifyApi");
const { BadRequestError, NotFoundError } = require("../expressError");

// Import shared test utilities and seeded test IDs
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds,
} = require("./_testCommon");

// Mock the Spotify API so real API calls are not made
jest.mock("../spotifyApi", () => ({
  getTrack: jest.fn(),
}));

// Setup test DB state before/after tests
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("PlaylistSongs model", function () {
  // Simulated Spotify track data returned from mocked API
  const mockSpotifyTrack = {
    body: {
      id: "test_spotify_id",
      name: "Mock Song",
      artists: [{ name: "Mock Artist" }],
      album: {
        name: "Mock Album",
        images: [{ url: "http://example.com/image.jpg" }],
      },
      preview_url: "http://example.com/preview.mp3",
    },
  };

  test("can add song to playlist", async function () {
    // Verifies that a song can be added to a playlist using Spotify track ID
    // Ensures returned data contains the playlist ID, song ID, and user who added it
    spotifyApi.getTrack.mockResolvedValueOnce(mockSpotifyTrack);

    const result = await PlaylistSongs.addSong(
      testPlaylistIds[0],
      "test_spotify_id",
      testUserIds[0]
    );

    expect(result).toEqual({
      playlist_id: testPlaylistIds[0],
      song_id: expect.any(Number),
      addedBy: testUserIds[0],
    });
  });

  test("throws error on duplicate song", async function () {
    // Confirms the model throws a BadRequestError if the same song
    // is added twice to the same playlist
    spotifyApi.getTrack.mockResolvedValue(mockSpotifyTrack);

    await PlaylistSongs.addSong(
      testPlaylistIds[0],
      "test_spotify_id",
      testUserIds[0]
    );

    try {
      await PlaylistSongs.addSong(
        testPlaylistIds[0],
        "test_spotify_id",
        testUserIds[0]
      );
      fail(); // Should not reach this line
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("can remove song", async function () {
    // Verifies that a song can be removed from a playlist
    // after being added
    spotifyApi.getTrack.mockResolvedValue(mockSpotifyTrack);

    const addResult = await PlaylistSongs.addSong(
      testPlaylistIds[0],
      "test_spotify_id",
      testUserIds[0]
    );

    const res = await PlaylistSongs.removeSong(
      testPlaylistIds[0],
      addResult.song_id
    );

    expect(res).toEqual({ message: "Song removed from playlist" });
  });

  test("throws error on remove of nonexistent song", async function () {
    // Confirms the model throws a NotFoundError if you try to
    // remove a song that does not exist in the playlist
    try {
      await PlaylistSongs.removeSong(testPlaylistIds[0], 99999);
      fail(); // Should not reach this line
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
