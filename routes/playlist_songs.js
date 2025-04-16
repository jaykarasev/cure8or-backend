"use strict";

const express = require("express");
const jsonschema = require("jsonschema");
const router = new express.Router();

const { authenticateJWT } = require("../middleware/auth");
const PlaylistSongs = require("../models/PlaylistSongs");
const { BadRequestError } = require("../expressError");

const playlistSongsSchema = require("../schemas/playlist_songs.json");

/**
 * POST /:playlistId/songs/:songId => { added: songId }
 *
 * Adds a song to a playlist.
 *
 * Authorization required: Logged-in user
 **/
router.post(
  "/:playlistId/songs/:songId",
  authenticateJWT,
  async function (req, res, next) {
    try {
      const playlistId = Number(req.params.playlistId);
      const songId = req.params.songId;
      const addedBy = res.locals.user.id;

      const payload = { playlistId, songId, addedBy };
      const validator = jsonschema.validate(payload, playlistSongsSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      await PlaylistSongs.addSong(playlistId, songId, addedBy);
      return res.json({ added: songId });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * DELETE /:playlistId/songs/:songId => { removed: songId }
 *
 * Removes a song from a playlist.
 *
 * Authorization required: Logged-in user
 **/
router.delete(
  "/:playlistId/songs/:songId",
  authenticateJWT,
  async function (req, res, next) {
    try {
      const { playlistId, songId } = req.params;

      await PlaylistSongs.removeSong(Number(playlistId), Number(songId));
      return res.json({ removed: songId });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
