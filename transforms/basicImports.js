var re = /^(?:var|let|const) ([a-zA-Z0-9_\$]+) = ?require\(([^\)]+)\);/gm;

module.exports = function (contents) {
  return contents.replace(re, 'import $1 from $2;');
};
