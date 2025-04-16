"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");

/** Related functions for songs. */

class Song {
  /** Add a new song to the database.
   *
   * data should be { title, artist, album, spotifyId, duration, previewUrl, imageUrl }
   *
   * Returns { id, title, artist, album, spotifyId, duration, previewUrl, imageUrl }
   **/
  static async create({
    title,
    artist,
    album,
    spotifyId,
    duration,
    previewUrl,
    imageUrl,
  }) {
    const result = await db.query(
      `INSERT INTO songs
       (title, artist, album, spotify_id, duration, preview_url, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, artist, album, spotify_id AS "spotifyId",
                 duration, preview_url AS "previewUrl", image_url AS "imageUrl"`,
      [title, artist, album, spotifyId, duration, previewUrl, imageUrl]
    );
    return result.rows[0];
  }

  /** Find all songs (optionally filter by title or artist). */
  static async findAll({ title, artist } = {}) {
    let query = `SELECT id, title, artist, album, spotify_id AS "spotifyId",
                        duration, preview_url AS "previewUrl", image_url AS "imageUrl",
                        spotify_url AS "spotifyUrl"
                 FROM songs`;

    let whereExpressions = [];
    let queryValues = [];

    if (title) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (artist) {
      queryValues.push(`%${artist}%`);
      whereExpressions.push(`artist ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY title";

    const songsRes = await db.query(query, queryValues);
    return songsRes.rows;
  }

  /** Find a song by Spotify ID or create it if it doesn't exist */
  static async findOrCreateBySpotifyId({
    title,
    artist,
    album,
    spotifyId,
    duration = null,
    previewUrl = null,
    imageUrl = null,
  }) {
    const result = await db.query(
      `SELECT id FROM songs WHERE spotify_id = $1`,
      [spotifyId]
    );

    if (result.rows[0]) {
      return { id: result.rows[0].id };
    }

    // If not found, create it
    const song = await Song.create({
      title,
      artist,
      album,
      spotifyId,
      duration,
      previewUrl,
      imageUrl,
    });

    return { id: song.id };
  }

  /** Get a song by ID. */
  static async get(id) {
    const result = await db.query(
      `SELECT id, title, artist, album, spotify_id AS "spotifyId",
              duration, preview_url AS "previewUrl", image_url AS "imageUrl",
              spotify_url AS "spotifyUrl"
       FROM songs
       WHERE id = $1`,
      [id]
    );

    const song = result.rows[0];
    if (!song) throw new NotFoundError(`No song found: ${id}`);
    return song;
  }

  /** Get all playlists that contain this song **/
  static async getPlaylists(songId) {
    const result = await db.query(
      `SELECT p.id, p.name, p.description, p.owner_id AS "ownerId", p.is_private AS "isPrivate"
       FROM playlists AS p
       JOIN playlist_songs AS ps ON p.id = ps.playlist_id
       WHERE ps.song_id = $1`,
      [songId]
    );

    return result.rows;
  }
}

module.exports = Song;
