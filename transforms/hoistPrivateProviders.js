var toProviderName = require('../lib/toProviderName');

var PrivateRE = /\bPrivate\(require\('([^']+)'\)\)/g;
var importRE = /^import/mg;

module.exports = function (contents, file) {
  if (file.path.endsWith('src/ui/public/private/private.js')) {
    // don't transform the private service, our dumb regexp break in the comments
    return contents;
  }

  var newImports = [];

  contents = contents.replace(PrivateRE, function (all, location) {
    var providerName = toProviderName(location);
    var matching = newImports.some(i => i.provider === providerName);
    if (!matching) {
      newImports.push({
        provider: providerName,
        statement: `import ${providerName} from '${location}';`
      });
    }

    return `Private(${providerName})`;
  })

  if (!newImports.length) {
    return contents;
  }

  var lastMatch, eachMatch;
  while (true) { // eslint-disable-line no-constant-condition
    eachMatch = importRE.exec(contents);
    if (eachMatch) lastMatch = eachMatch;
    else break;
  }

  var prefix = '';
  var postFix = contents;

  if (lastMatch) {
    var lastImportEOL = contents.indexOf('\n', lastMatch.index) + 1;
    prefix = contents.slice(0, lastImportEOL) + '\n';
    postFix = contents.slice(lastImportEOL);
  } else {
    postFix = '\n' + contents;
  }

  return prefix + newImports.map(i => i.statement).join('\n') + '\n' + postFix;
}
