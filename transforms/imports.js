var injectNewImports = require('../lib/injectNewImports');

var importTransforms = [
  require('./imports/basic'),
  require('./imports/raw'),
  require('./imports/property'),
  require('./imports/destructured')
]

module.exports = function (contents) {
  var newImports = [];

  contents = contents
  .split(/\r?\n/g)
  .map(function (line) {
    var indent = (line.match(/^(\s+)/) || [])[1] || '';
    var unindented = line.slice(indent.length);

    var transformed = importTransforms.reduce(function (contents, fn) {
      return fn(contents);
    }, unindented);

    if (unindented !== transformed) {
      newImports.push(transformed);
      return null;
    }

    return line
  })
  .filter(l => l !== null)
  .join('\n');

  return injectNewImports(newImports, contents)
}
