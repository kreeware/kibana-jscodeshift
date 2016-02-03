
var re = /^(?:var|let|const) (\{.+\}) = require\(([^\)]+)\);/gm;

module.exports = function (contents) {
  return contents.replace(re, function (all, destruct, location) {
    destruct = destruct.replace(/\s*:\s*/g, ' as ')
    return 'import ' + destruct + ' from ' + location + ';';
  })
};
