"use strict";

const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");
const Song = require("./Song");
const spotifyApi = require("../spotifyApi");

/** Related functions for managing songs in playlists. */

class PlaylistSongs {
  /**
   * Add a song to a playlist
   *
   * @param {number} playlistId
   * @param {string} spotifyId
   * @param {number} userId
   * @returns {object} { playlistId, songId, addedBy }
   */
  static async addSong(playlistId, spotifyId, userId) {
    const playlistCheck = await db.query(
      `SELECT id FROM playlists WHERE id = $1`,
      [playlistId]
    );
    if (!playlistCheck.rows[0]) {
      throw new NotFoundError(`No playlist found with id: ${playlistId}`);
    }

    // Get the song from Spotify API
    const spotifyTrack = await spotifyApi.getTrack(spotifyId);
    const track = spotifyTrack.body;

    const songData = {
      spotifyId: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      previewUrl: track.preview_url || null,
      imageUrl: track.album.images[0]?.url || null,
    };

    // Either find or create the song
    const song = await Song.findOrCreateBySpotifyId(songData);

    // Check for duplicates
    const duplicateCheck = await db.query(
      `SELECT id FROM playlist_songs
       WHERE playlist_id = $1 AND song_id = $2`,
      [playlistId, song.id]
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError("Song already exists in this playlist.");
    }

    const result = await db.query(
      `INSERT INTO playlist_songs (playlist_id, song_id, added_by)
       VALUES ($1, $2, $3)
       RETURNING playlist_id, song_id, added_by AS "addedBy"`,
      [playlistId, song.id, userId]
    );

    return result.rows[0];
  }

  /** Remove a song from a playlist */
  static async removeSong(playlistId, songId) {
    const result = await db.query(
      `DELETE FROM playlist_songs
       WHERE playlist_id = $1 AND song_id = $2
       RETURNING playlist_id, song_id`,
      [playlistId, songId]
    );

    if (!result.rows[0]) {
      throw new NotFoundError(
        `Song with id ${songId} not found in playlist ${playlistId}`
      );
    }
    return { message: "Song removed from playlist" };
  }
}

module.exports = PlaylistSongs;
