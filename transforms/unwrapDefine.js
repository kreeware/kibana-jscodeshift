module.exports = function (contents) {
  var inDefine = false;

  return contents
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

    if (line.startsWith('return ')) {
      line = 'export default ' + line.slice(7);
    }

    return line;
  })
  .filter(function (line) {
    return line !== null
  })
  .join('\n');
};
