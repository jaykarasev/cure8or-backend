"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/User");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** GET / => { users: [ {id, username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: logged-in user
 **/
router.get("/", async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id] => { user }
 *
 * Returns { id, username, firstName, lastName, email, playlists, joinedPlaylists }
 *
 * Authorization required: logged-in user
 **/
router.get("/:id", async function (req, res, next) {
  try {
    const user = await User.get(req.params.id);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { id, username, firstName, lastName, email }
 *
 * Authorization required: logged-in user updating their own account
 **/
router.patch("/:id", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    // Ensure the logged-in user is updating their own account
    if (res.locals.user.id !== Number(req.params.id)) {
      throw new UnauthorizedError("You can only update your own account.");
    }

    const user = await User.update(req.params.id, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: userId }
 *
 * Authorization required: logged-in user deleting their own account
 **/
router.delete("/:id", async function (req, res, next) {
  try {
    // Ensure the logged-in user is deleting their own account
    if (res.locals.user.id !== Number(req.params.id)) {
      throw new UnauthorizedError("You can only delete your own account.");
    }

    await User.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
