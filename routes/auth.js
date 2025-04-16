"use strict";

/** Routes for authentication (login & registration). */

const jsonschema = require("jsonschema");
const express = require("express");
const User = require("../models/User");
const { createToken } = require("../helpers/token");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError } = require("../expressError");

const router = express.Router();

/** POST /auth/token:  { identifier, password } => { token }
 *
 * Allows a user to log in with **either** their `username` or `email`.
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const { identifier, password } = req.body;

    // This will throw UnauthorizedError if credentials are bad
    const user = await User.authenticate(identifier, password);
    const token = createToken(user);

    console.log("Login Successful:", { token, user });

    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
});

/** POST /auth/register:   { user } => { token }
 *
 * Registers a new user.
 *
 * The request body must include:
 *   { username, firstName, lastName, email, password }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    // ✅ Validate request body against the schema
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, firstName, lastName, email, password, imageUrl } =
      req.body;

    const user = await User.register({
      username,
      firstName,
      lastName,
      email,
      password,
      imageUrl,
    });

    const token = createToken(user);

    console.log("Signup Successful:", { token, user });

    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
