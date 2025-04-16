const db = require("../db");
const { NotFoundError } = require("../expressError");

class PlaylistAccess {
  /** Grant access to a private playlist */
  static async grantAccess(userId, playlistId) {
    await db.query(
      `INSERT INTO playlist_access (user_id, playlist_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, playlistId]
    );
  }

  /** Check if user has access to a private playlist */
  static async hasAccess(userId, playlistId) {
    const result = await db.query(
      `SELECT 1 FROM playlist_access
       WHERE user_id = $1 AND playlist_id = $2`,
      [userId, playlistId]
    );
    return result.rows.length > 0;
  }
}

module.exports = PlaylistAccess;
