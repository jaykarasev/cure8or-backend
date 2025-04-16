"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** Authenticate user with email or username, and password.
   *
   * Returns { id, username, firstName, lastName, email }
   *
   * Throws UnauthorizedError if user not found or wrong password.
   **/
  static async authenticate(identifier, password) {
    const result = await db.query(
      `SELECT id, username, password, first_name AS "firstName", last_name AS "lastName", email
       FROM users
       WHERE username = $1 OR email = $1`,
      [identifier] // Can be either username or email
    );

    const user = result.rows[0];
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/email or password");
  }

  /** Register user with data.
   *
   * Returns { id, username, firstName, lastName, email }
   *
   * Throws BadRequestError on duplicates.
   **/
  static async register({
    username,
    firstName,
    lastName,
    email,
    password,
    imageUrl,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username FROM users WHERE username = $1`,
      [username]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // If no image is provided, use a default avatar.
    const profileImage =
      typeof imageUrl === "string" && imageUrl.trim() !== ""
        ? imageUrl.trim()
        : "https://example.com/default-profile.png";

    const result = await db.query(
      `INSERT INTO users 
        (username, first_name, last_name, email, password, image_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id, username, first_name AS "firstName", last_name AS "lastName", 
                  email, image_url AS "imageUrl", created_at AS "createdAt"`,
      [username, firstName, lastName, email, hashedPassword, profileImage]
    );

    return result.rows[0];
  }

  /** Find all users.
   *
   * Returns [{ id, username, firstName, lastName, email }, ...]
   **/
  static async findAll() {
    const result = await db.query(
      `SELECT id, username, first_name AS "firstName", last_name AS "lastName", email
       FROM users
       ORDER BY username`
    );

    return result.rows;
  }

  /** Given an ID, return data about the user.
   *
   * Returns { id, username, firstName, lastName, email, playlists }
   *   where playlists is an array of { id, name, description, isPrivate }
   *
   * Throws NotFoundError if user not found.
   **/
  static async get(id) {
    const userRes = await db.query(
      `SELECT id, 
              username, 
              first_name AS "firstName", 
              last_name AS "lastName", 
              email, 
              image_url AS "imageUrl",
              created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [id]
    );

    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`No user found with id: ${id}`);

    const playlistsRes = await db.query(
      `SELECT id,
              name,
              description,
              is_private AS "isPrivate",
              image_url AS "imageUrl",
              owner_id AS "ownerId"
       FROM playlists
       WHERE owner_id = $1`,
      [id]
    );

    const accessPlaylistsRes = await db.query(
      `SELECT p.id,
              p.name,
              p.description,
              p.is_private AS "isPrivate",
              p.image_url AS "imageUrl",
              p.owner_id AS "ownerId",
              u.username AS "ownerUsername"
       FROM playlists AS p
       JOIN playlist_access AS pa ON p.id = pa.playlist_id
       JOIN users AS u ON p.owner_id = u.id
       WHERE pa.user_id = $1`,
      [id]
    );

    user.playlists = playlistsRes.rows;
    user.accessPlaylists = accessPlaylistsRes.rows;

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if `data` doesn't contain
   * all the fields; only provided ones will be changed.
   *
   * Data can include:
   *   { firstName, lastName, password, email }
   *
   * Returns { id, username, firstName, lastName, email }
   *
   * Throws NotFoundError if the user is not found.
   */
  static async update(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(data, {
      firstName: "first_name",
      lastName: "last_name",
      imageUrl: "image_url",
    });

    const idVarIdx = "$" + (values.length + 1);
    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, username, first_name AS "firstName", last_name AS "lastName", email, image_url AS "imageUrl"`;
    const result = await db.query(querySql, [...values, id]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user found with id: ${id}`);

    return user;
  }

  /** Delete given user from database. */
  static async remove(id) {
    let result = await db.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, username`,
      [id]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user found with id: ${id}`);

    return user;
  }
}

module.exports = User;
