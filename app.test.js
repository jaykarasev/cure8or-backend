const request = require("supertest");
const app = require("./app");
const db = require("./db");

describe("App", function () {
  test("returns 404 for non-existent route", async function () {
    const resp = await request(app).get("/no-such-path");
    expect(resp.statusCode).toEqual(404);
  });

  test("returns 404 and logs stack when NODE_ENV is not test", async function () {
    process.env.NODE_ENV = "";
    const resp = await request(app).get("/no-such-path");
    expect(resp.statusCode).toEqual(404);
    delete process.env.NODE_ENV;
  });
});

afterAll(function () {
  db.end();
});
