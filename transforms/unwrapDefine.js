var importTransforms = [
  require('./basicImports'),
  require('./rawImports'),
  require('./propertyImports'),
  require('./descructuredImports')
]

module.exports = function (contents) {
  var inDefine = false
  var hoisted = [];
  var unwrappedContent = contents
  .split(/\r?\n/g)
  .map(function (line) {
    if (!inDefine) {
      if (line === 'define(function (require) {') {
        inDefine = true;
        return null;
      }

      return line;
    }

    if (line === '});') {
      inDefine = false;
      return null;
    }

    // unindent
    line = line.slice(2);

    if (line.startsWith('  ')) {
      var indent = line.match(/^(\s+)/)[1];
      var unindented = line.slice(indent.length);

      var transformed = importTransforms.reduce(function (contents, fn) {
        return fn(contents);
      }, unindented);

      if (unindented !== transformed) {
        hoisted.push(transformed);
        return null;
      }
    }

    if (line.startsWith('return ')) {
      line = 'export default ' + line.slice(7);
    }

    return line;
  })
  .filter(function (line) {
    return line !== null
  });

  if (hoisted.length) {
    return hoisted.concat('', unwrappedContent).join('\n');
  } else {
    return unwrappedContent.join('\n');
  }
};
