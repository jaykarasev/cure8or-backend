// playlist_songs.test.js
jest.setTimeout(30000);

const db = require("../db");
const request = require("supertest");
const app = require("../app");
const { createToken } = require("../helpers/token");

require("./_testCommonPlaylistSongs"); //  This sets up db.connect/end for isolated test DB use

// Mock the Spotify API response so it doesn't make real API calls during testing
jest.mock("../spotifyApi", () => ({
  getTrack: jest.fn().mockResolvedValue({
    body: {
      id: "mock-spotify-id",
      name: "Mock Song",
      artists: [{ name: "Mock Artist" }],
      album: {
        name: "Mock Album",
        images: [{ url: "http://mockimage.com" }],
      },
      preview_url: "http://mockpreview.com",
    },
  }),
}));

describe("PlaylistSongs Routes", () => {
  let token;
  let playlistId;
  let songId;
  const spotifyId = "mock-spotify-id";

  // Setup: Clean DB and insert test user, song, and playlist
  beforeAll(async () => {
    // Clear any existing test data
    await db.query("DELETE FROM playlist_songs");
    await db.query("DELETE FROM songs");
    await db.query("DELETE FROM playlists");
    await db.query("DELETE FROM users");

    // Create a test user and generate token
    const userRes = await db.query(`
      INSERT INTO users (username, password, first_name, last_name, email)
      VALUES ('testuser', 'hashedpw', 'Test', 'User', 'test@example.com')
      RETURNING id
    `);
    const userId = userRes.rows[0].id;
    token = createToken({ id: userId });

    // Insert a mock song directly into the DB
    const songRes = await db.query(`
      INSERT INTO songs (spotify_id, title, artist, album, duration, preview_url, image_url)
      VALUES ('${spotifyId}', 'Mock Song', 'Mock Artist', 'Mock Album', 180000, 'http://example.com/preview.mp3', 'http://example.com/image.png')
      RETURNING id
    `);
    songId = songRes.rows[0].id;

    // Create a test playlist owned by the test user
    const playlistRes = await db.query(
      `
      INSERT INTO playlists (name, description, is_private, owner_id)
      VALUES ('Test Playlist', 'A test playlist', false, $1)
      RETURNING id
    `,
      [userId]
    );
    playlistId = playlistRes.rows[0].id;
  });

  // Test: Adding a song to a playlist via POST route
  test("POST /playlist_songs/:playlistId/songs/:spotifyId adds song", async () => {
    const resp = await request(app)
      .post(`/playlist_songs/${playlistId}/songs/${spotifyId}`)
      .set("authorization", `Bearer ${token}`);

    // Expect successful response and correct body
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ added: spotifyId });

    // Confirm song was added to the songs table if not already present
    const songRes = await db.query(
      `SELECT id FROM songs WHERE spotify_id = $1`,
      [spotifyId]
    );
    songId = songRes.rows[0].id;
  });

  // Test: Removing a song from a playlist via DELETE route
  test("DELETE /playlist_songs/:playlistId/songs/:songId removes song", async () => {
    const resp = await request(app)
      .delete(`/playlist_songs/${playlistId}/songs/${songId}`)
      .set("authorization", `Bearer ${token}`);

    // Expect successful response and correct body
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ removed: String(songId) });
  });
});
