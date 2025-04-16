const jwt = require("jsonwebtoken");
const { createToken } = require("../helpers/token");
const { SECRET_KEY } = require("../config");

describe("createToken", function () {
  test("creates token for non-admin user", function () {
    const token = createToken({ id: 1, isAdmin: false });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      id: 1,
      isAdmin: false,
    });
  });

  test("creates token for admin user", function () {
    const token = createToken({ id: 2, isAdmin: true });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      id: 2,
      isAdmin: true,
    });
  });

  test("defaults isAdmin to false if not provided", function () {
    const token = createToken({ id: 3 });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      id: 3,
      isAdmin: false,
    });
  });
});
