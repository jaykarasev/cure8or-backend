"use strict";

const express = require("express");
const cors = require("cors");
const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const playlistsRoutes = require("./routes/playlists");
const songsRoutes = require("./routes/songs");
const playlistSongsRoutes = require("./routes/playlist_songs");

const app = express();

app.use(cors());
app.use(express.json());

// Apply authentication middleware globally
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/playlists", playlistsRoutes);
app.use("/songs", songsRoutes);
app.use("/playlist_songs", playlistSongsRoutes);

/** Handle 404 errors */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** General error handler */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  return res.status(status).json({
    error: { message: err.message, status },
  });
});

module.exports = app;
