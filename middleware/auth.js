const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const db = require("../db");
const Playlist = require("../models/Playlist");

/** Middleware: Authenticate user via JWT. */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware: Ensure user is logged in. */
function ensureLoggedIn(req, res, next) {
  if (!res.locals.user) throw new UnauthorizedError();
  return next();
}

/** Middleware: Ensure user has access to a playlist. */
async function ensurePlaylistAccess(req, res, next) {
  try {
    const userId = res.locals.user?.id;
    const playlistId = parseInt(req.params.id, 10);

    if (!userId) throw new UnauthorizedError("User ID is missing from token.");

    // Fetch the playlist details
    const playlist = await Playlist.get(playlistId);
    if (!playlist)
      throw new UnauthorizedError(`No playlist found with ID: ${playlistId}`);

    // ✅ If the user is the owner, grant access automatically
    if (playlist.ownerId === userId) {
      return next();
    }

    // 🔒 Check if the user has previously unlocked access
    const result = await db.query(
      `SELECT id FROM playlist_access WHERE user_id = $1 AND playlist_id = $2`,
      [userId, playlistId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError("You do not have access to this playlist.");
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensurePlaylistAccess,
};
