// _testCommon.js
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

let testUserIds = [];
let testPlaylistIds = [];

async function commonBeforeAll() {
  await db.connect(); // ✅ Connect once at the start of tests

  await db.query("DELETE FROM playlist_songs");
  await db.query("DELETE FROM playlist_access");
  await db.query("DELETE FROM playlists");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM songs");

  const hashedPassword = await bcrypt.hash("password", BCRYPT_WORK_FACTOR);

  const resultUsers = await db.query(
    `INSERT INTO users (username, first_name, last_name, email, password, image_url, created_at)
     VALUES ('testuser', 'Test', 'User', 'test@example.com', $1, 'http://test.img', CURRENT_TIMESTAMP)
     RETURNING id`,
    [hashedPassword]
  );
  testUserIds[0] = resultUsers.rows[0].id;

  const resultPlaylists = await db.query(
    `INSERT INTO playlists (name, description, owner_id, is_private, password, image_url)
     VALUES ('Chill Vibes', 'Just vibes', $1, false, null, 'http://image.com')
     RETURNING id`,
    [testUserIds[0]]
  );
  testPlaylistIds[0] = resultPlaylists.rows[0].id;
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end(); // ✅ Clean up and close the connection
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testUserIds,
  testPlaylistIds,
};
