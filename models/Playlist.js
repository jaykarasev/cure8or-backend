"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");

class Playlist {
  /** Create a new playlist */
  static async create({
    name,
    description,
    ownerId,
    isPrivate,
    password,
    imageUrl,
  }) {
    const hashedPassword = isPrivate
      ? await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
      : null;

    const result = await db.query(
      `INSERT INTO playlists (name, description, owner_id, is_private, password, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, owner_id AS "ownerId", is_private AS "isPrivate",
                 created_at AS "createdAt", image_url AS "imageUrl"`,
      [name, description, ownerId, isPrivate, hashedPassword, imageUrl]
    );

    return result.rows[0];
  }

  /** Get all playlists */
  static async findAll() {
    const res = await db.query(
      `SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.owner_id AS "ownerId", 
        u.username AS "ownerUsername",
        p.is_private AS "isPrivate", 
        p.created_at AS "createdAt", 
        p.image_url AS "imageUrl"
     FROM playlists AS p
     JOIN users AS u ON p.owner_id = u.id
     ORDER BY p.created_at DESC`
    );
    return res.rows;
  }

  /** Get full details of a playlist if the user has access */
  static async get(playlistId, userId, password = null) {
    const playlistRes = await db.query(
      `SELECT id, name, description, owner_id AS "ownerId", is_private AS "isPrivate",
            created_at AS "createdAt", image_url AS "imageUrl", password AS "hashedPassword"
     FROM playlists
     WHERE id = $1`,
      [playlistId]
    );

    const playlist = playlistRes.rows[0];

    if (!playlist) throw new NotFoundError(`No playlist: ${playlistId}`);

    // ✅ Let the owner access their own private playlist
    if (playlist.isPrivate && playlist.ownerId !== userId) {
      const hasAccess = await Playlist.hasAccess(userId, playlistId);
      if (!hasAccess) {
        if (
          !password ||
          !(await bcrypt.compare(password, playlist.hashedPassword))
        ) {
          throw new UnauthorizedError("Incorrect password.");
        }
        await Playlist.grantAccess(userId, playlistId);
      }
    }

    // ✅ Remove password hash before returning
    delete playlist.hashedPassword;

    // ✅ Get songs
    const songsRes = await db.query(
      `SELECT 
          s.id, 
          s.title, 
          s.artist, 
          s.album, 
          s.duration, 
          s.image_url AS "imageUrl",
          ps.added_by AS "addedBy",
          u.image_url AS "addedByImage",
          u.username AS "addedByUsername"
       FROM songs s
       JOIN playlist_songs ps ON ps.song_id = s.id
       JOIN users u ON ps.added_by = u.id
       WHERE ps.playlist_id = $1`,
      [playlistId]
    );

    playlist.songs = songsRes.rows;

    return playlist;
  }

  /** Check if user already has access */
  static async hasAccess(userId, playlistId) {
    const res = await db.query(
      `SELECT id FROM playlist_access WHERE user_id = $1 AND playlist_id = $2`,
      [userId, playlistId]
    );
    return res.rows.length > 0;
  }

  /** Grant user access to private playlist */
  static async grantAccess(userId, playlistId) {
    await db.query(
      `INSERT INTO playlist_access (user_id, playlist_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, playlist_id) DO NOTHING`,
      [userId, playlistId]
    );
  }

  /** Get basic info for playlist (used before checking password or access) */
  static async getBasicInfo(id) {
    const result = await db.query(
      `SELECT id, name, description, owner_id AS "ownerId",
            is_private AS "isPrivate", password, created_at AS "createdAt", image_url AS "imageUrl"
     FROM playlists
     WHERE id = $1`,
      [id]
    );

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError(`No playlist: ${id}`);
    return playlist;
  }

  /** Update playlist data */
  static async update(id, data) {
    // If updating password, hash it before storing
    if (data.password !== undefined && data.password !== "") {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { name, description, imageUrl, isPrivate, password } = data;

    const result = await db.query(
      `UPDATE playlists
       SET name = $1,
           description = $2,
           image_url = $3,
           is_private = $4,
           password = $5
       WHERE id = $6
       RETURNING id,
                 name,
                 description,
                 image_url AS "imageUrl",
                 is_private AS "isPrivate"`,
      [name, description, imageUrl, isPrivate, password, id]
    );

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError(`No playlist with id: ${id}`);
    return playlist;
  }

  /** Delete a playlist by ID */
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM playlists WHERE id = $1 RETURNING id`,
      [id]
    );

    const playlist = result.rows[0];
    if (!playlist) throw new NotFoundError(`No playlist: ${id}`);
  }
}

module.exports = Playlist;
