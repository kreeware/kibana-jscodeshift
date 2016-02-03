var re = /^(var|let|const) ([a-zA-Z0-9_\$]+) = require\(([^\)]+)\)\.([a-zA-Z0-9_\$]+);/gm;

module.exports = function (contents) {
  return contents.replace(re, function (all, bind, name, location, subname) {
    if (name === subname) {
      return 'import { ' + name + ' } from ' + location + ';';
    } else {
      return 'import { ' + subname + ' as ' + name + ' } from ' + location + ';';
    }
  })
};
