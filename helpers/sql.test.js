const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("works: 1 field", function () {
    const result = sqlForPartialUpdate(
      { playlistName: "Cure Vibes" },
      { playlistName: "playlist_name" }
    );
    expect(result).toEqual({
      setCols: '"playlist_name"=$1',
      values: ["Cure Vibes"],
    });
  });

  test("works: multiple fields with some mappings", function () {
    const result = sqlForPartialUpdate(
      { playlistName: "Late Night", isPrivate: true },
      { playlistName: "playlist_name", isPrivate: "is_private" }
    );
    expect(result).toEqual({
      setCols: '"playlist_name"=$1, "is_private"=$2',
      values: ["Late Night", true],
    });
  });

  test("works: multiple fields with no mapping", function () {
    const result = sqlForPartialUpdate(
      { name: "Test", description: "test desc" },
      {}
    );
    expect(result).toEqual({
      setCols: '"name"=$1, "description"=$2',
      values: ["Test", "test desc"],
    });
  });

  test("throws BadRequestError with no data", function () {
    expect(() =>
      sqlForPartialUpdate({}, { playlistName: "playlist_name" })
    ).toThrow(BadRequestError);
  });
});
