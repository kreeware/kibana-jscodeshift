var through = require('through2').obj;
var relative = require('path').relative;
var join = require('path').join;
var unlink = require('fs').unlinkSync;

module.exports = function () {
  return through(function (file, env, cb) {
    if (file.isDirectory()) {
      return cb();
    }

    var out = transform(file);
    var outFile = file.clone();

    if (out.path !== file.path) {
      unlink(outFile.path);
      outFile.path = out.path;
    }

    if (out.contents !== file.contents) {
      outFile.contents = new Buffer(out.contents, 'utf8');
    }

    cb(null, outFile);
  })
};

function transform(file) {
  var newContents = file.contents;
  var newPath = file.path;

  if (file.path.endsWith('.js')) {
    newContents = new Buffer(
      newContents
      .toString('utf8')
      .split(/\r?\n/)
      .map(function (line) {
        if (line.includes('require(') || line.startsWith('import ')) {
          return line.replace(/'([^']+)'/g, function (match, path) {
            if (path.startsWith('.') || path.startsWith('ui/') || path.startsWith('plugins/') || path.startsWith('testUtils/')) {
              return "'" + transformPath(path) + "'";
            } else {
              return match;
            }
          });
        } else {
          return line;
        }
      })
      .join('\n'),
      'utf8'
    );
  }

  if (!file.path.endsWith('.txt') && !file.path.endsWith('.md')) {
    newPath = transformPath(newPath);
  }

  return { contents: newContents, path: newPath };
}

const cwd = process.cwd();
function transformPath(path) {
  var base = null;
  var relativePath = path;
  if (path.startsWith(cwd)) {
    base = cwd;
    relativePath = relative(cwd, path);
  }

  if (base) {
    return join(base, stupidSnakeCase(relativePath));
  } else {
    return stupidSnakeCase(relativePath);
  }
}

function stupidSnakeCase(path) {
  return path
    .replace(/[a-z][A-Z]/g, function (match) {
      return match[0] + '_' + match[1];
    })
    .replace(/(^|_|\/)([A-Z])/g, function (match, first, char) {
      return first + char.toLowerCase();
    });
}
