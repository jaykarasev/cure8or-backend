"use strict";

describe("config settings", function () {
  test("loads config from env vars", function () {
    process.env.SECRET_KEY = "test-secret";
    process.env.PORT = "1234";
    process.env.DATABASE_URL = "postgresql://localhost/testdb";
    process.env.NODE_ENV = "production";

    const config = require("./config");

    expect(config.SECRET_KEY).toEqual("test-secret");
    expect(config.PORT).toEqual(1234);
    expect(config.getDatabaseUri()).toEqual("postgresql://localhost/testdb");
    expect(config.BCRYPT_WORK_FACTOR).toEqual(12);

    delete process.env.SECRET_KEY;
    delete process.env.PORT;
    delete process.env.DATABASE_URL;

    // Should fallback to default dev database if no DATABASE_URL
    expect(config.getDatabaseUri()).toEqual("postgresql://localhost/cure8or");

    process.env.NODE_ENV = "test";
    expect(config.getDatabaseUri()).toEqual(
      "postgresql://localhost/cure8or_test"
    );
  });
});
