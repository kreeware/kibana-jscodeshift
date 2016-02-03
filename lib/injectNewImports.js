var _ = require('lodash');
var importRE = /^import/mg;

module.exports = function (newImports, contents) {
  if (!newImports.length) {
    return contents;
  }

  newImports = _.uniq(newImports);
  var prefix = '';
  var postFix = contents;

  var lastMatch, eachMatch;
  while (true) { // eslint-disable-line no-constant-condition
    eachMatch = importRE.exec(contents);
    if (eachMatch) lastMatch = eachMatch;
    else break;
  }

  if (lastMatch) {
    var lastImportEOL = contents.indexOf('\n', lastMatch.index) + 1;
    prefix = contents.slice(0, lastImportEOL) + '\n';
    postFix = contents.slice(lastImportEOL);
  } else {
    postFix = '\n' + contents;
  }

  return prefix + newImports.join('\n') + '\n' + postFix;
}
