const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 *
 * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}
 * @param jsToSql {Object} maps JS-style data fields to SQL column names,
 *   like { playlistName: "playlist_name", songTitle: "song_title" }
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {playlistName: 'Road Trip', isPrivate: false} =>
 *   { setCols: '"playlist_name"=$1, "is_private"=$2',
 *     values: ['Road Trip', false] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
