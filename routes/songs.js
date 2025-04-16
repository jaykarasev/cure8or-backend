"use strict";

/** Routes for managing songs. */

const express = require("express");
const jsonschema = require("jsonschema");
const { BadRequestError } = require("../expressError");
const Song = require("../models/Song");
const songNewSchema = require("../schemas/songNew.json");
const spotifyApi = require("../spotifyApi");

const router = express.Router();

/** GET /search?q=query
 *  Searches Spotify for a song by title or artist.
 *  Returns a list of matching songs.
 */
router.get("/search", async function (req, res, next) {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const data = await spotifyApi.searchTracks(query, { limit: 10 });

    const results = data.body.tracks.items.map((track) => {
      console.log("🔍 Spotify Track Data:", track); // Debugging
      console.log("🎵 Preview URL:", track.preview_url); // Logs preview URL

      return {
        spotifyId: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(", "),
        album: track.album.name,
        previewUrl: track.preview_url || null, // Keep preview if available
        spotifyUrl: `https://open.spotify.com/track/${track.id}`, // Add Spotify Web Player link
        imageUrl:
          track.album.images.length > 0 ? track.album.images[0].url : null,
      };
    });

    return res.json({ songs: results });
  } catch (err) {
    return next(err);
  }
});

/** GET /:id => { song }
 *
 * Retrieves details of a specific song.
 *
 * - If the song is in the database, it returns stored data.
 * - If the song is **not** in the database, it fetches from Spotify and saves it.
 *
 * Returns:
 *    { id, spotifyId, title, artist, album, duration, previewUrl, imageUrl }
 *
 * Authorization required: **None**
 **/
router.get("/:id", async function (req, res, next) {
  try {
    const song = await Song.get(req.params.id);
    return res.json({ song });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>  { songs: [...] }
 *
 * Retrieves all songs in the database.
 * Can optionally filter by `title` or `artist`.
 **/
router.get("/", async function (req, res, next) {
  try {
    const songs = await Song.findAll(req.query);
    return res.json({ songs });
  } catch (err) {
    return next(err);
  }
});

/** POST /  { title, artist, album, duration, previewUrl, imageUrl }
 *
 * Adds a new song to the database.
 *
 * Returns { id, title, artist, album, duration, previewUrl, imageUrl }
 **/
router.post("/", async function (req, res, next) {
  try {
    console.log("Adding new song:", req.body);

    const validator = jsonschema.validate(req.body, songNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const newSong = await Song.create(req.body);
    return res.status(201).json({ song: newSong });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
