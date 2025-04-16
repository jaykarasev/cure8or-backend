const express = require("express");
const router = new express.Router();
const jsonschema = require("jsonschema");

const Playlist = require("../models/Playlist");
const { authenticateJWT } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");

const playlistNewSchema = require("../schemas/playlistNew.json");
const playlistUpdateSchema = require("../schemas/playlistUpdate.json");

/** Create a new playlist */
router.post("/", authenticateJWT, async function (req, res, next) {
  console.log("REQ.BODY >>>", req.body);
  try {
    const validator = jsonschema.validate(req.body, playlistNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const userId = res.locals.user.id;
    console.log("OWNER ID:", res.locals.user);
    const playlist = await Playlist.create({ ...req.body, ownerId: userId });
    return res.status(201).json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** Get all playlists */
router.get("/", authenticateJWT, async function (req, res, next) {
  try {
    const playlists = await Playlist.findAll();
    return res.json({ playlists });
  } catch (err) {
    return next(err);
  }
});

/** Get a specific playlist */
router.get("/:id", authenticateJWT, async function (req, res, next) {
  try {
    const { id } = req.params;
    if (!res.locals.user) {
      throw new UnauthorizedError("You must be logged in to access playlists.");
    }

    const userId = res.locals.user.id;
    const playlist = await Playlist.get(Number(id), userId);
    return res.json({ playlist });
  } catch (err) {
    return next(err);
  }
});

/** Unlock a private playlist */
router.post("/:id/access", authenticateJWT, async function (req, res, next) {
  try {
    const { password } = req.body;
    const authUserId = res.locals.user?.id;

    if (!authUserId) {
      throw new UnauthorizedError("User ID is missing.");
    }

    const playlistId = Number(req.params.id);
    console.log(
      `Unlock request for Playlist ID: ${playlistId} by User ID: ${authUserId}`
    );

    const playlist = await Playlist.getBasicInfo(playlistId);
    if (!playlist) throw new BadRequestError("Playlist not found.");

    if (playlist.ownerId === authUserId || !playlist.isPrivate) {
      const unlockedPlaylist = await Playlist.get(playlistId, authUserId);
      return res.json({ playlist: unlockedPlaylist });
    }

    const unlockedPlaylist = await Playlist.get(
      playlistId,
      authUserId,
      password
    );
    return res.json({ playlist: unlockedPlaylist });
  } catch (err) {
    return next(err);
  }
});

/** Update a playlist */
router.patch("/:id", authenticateJWT, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, playlistUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    // Pass entire validated body
    const updatedPlaylist = await Playlist.update(req.params.id, req.body);
    console.log("PATCH /playlists/:id - updating with:", req.body);
    return res.json({ playlist: updatedPlaylist });
  } catch (err) {
    return next(err);
  }
});

/** Delete a playlist */
router.delete("/:id", authenticateJWT, async function (req, res, next) {
  try {
    await Playlist.remove(req.params.id);
    return res.json({ message: "Playlist deleted successfully." });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
