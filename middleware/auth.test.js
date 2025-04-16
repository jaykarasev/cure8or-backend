"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
  ensurePlaylistAccess,
} = require("./auth");

const Playlist = require("../models/Playlist");
const db = require("../db");

jest.mock("../models/Playlist");
jest.mock("../db");

const { SECRET_KEY } = require("../config");

const testJwt = jwt.sign(
  { id: 1, username: "testuser", isAdmin: false },
  SECRET_KEY
);
const badJwt = jwt.sign(
  { id: 1, username: "testuser", isAdmin: false },
  "wrong"
);

describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = jest.fn();

    authenticateJWT(req, res, next);

    expect(res.locals.user).toEqual({
      iat: expect.any(Number),
      id: 1,
      username: "testuser",
      isAdmin: false,
    });
    expect(next).toHaveBeenCalledWith();
  });

  test("no header", function () {
    const req = {};
    const res = { locals: {} };
    const next = jest.fn();

    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
    expect(next).toHaveBeenCalledWith();
  });

  test("invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = jest.fn();

    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
    expect(next).toHaveBeenCalledWith();
  });
});

describe("ensureLoggedIn", function () {
  test("works when logged in", function () {
    const req = {};
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    ensureLoggedIn(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  test("unauthorized when not logged in", function () {
    const req = {};
    const res = { locals: {} };
    const next = jest.fn();

    expect(() => ensureLoggedIn(req, res, next)).toThrow(UnauthorizedError);
  });
});

describe("ensurePlaylistAccess", function () {
  beforeEach(() => {
    Playlist.get.mockReset();
    db.query.mockReset();
  });

  test("grants access if user is owner", async function () {
    Playlist.get.mockResolvedValue({ id: 1, ownerId: 1 });
    const req = { params: { id: "1" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    await ensurePlaylistAccess(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  test("grants access if user has access in playlist_access", async function () {
    Playlist.get.mockResolvedValue({ id: 1, ownerId: 2 });
    db.query.mockResolvedValue({ rows: [{ id: 123 }] });
    const req = { params: { id: "1" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    await ensurePlaylistAccess(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  test("denies access if not owner and no access", async function () {
    Playlist.get.mockResolvedValue({ id: 1, ownerId: 2 });
    db.query.mockResolvedValue({ rows: [] });
    const req = { params: { id: "1" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    await ensurePlaylistAccess(req, res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  test("denies access if playlist not found", async function () {
    Playlist.get.mockResolvedValue(null);
    const req = { params: { id: "1" } };
    const res = { locals: { user: { id: 1 } } };
    const next = jest.fn();

    await ensurePlaylistAccess(req, res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  test("denies access if no user in res.locals", async function () {
    const req = { params: { id: "1" } };
    const res = { locals: {} };
    const next = jest.fn();

    await ensurePlaylistAccess(req, res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});
