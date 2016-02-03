var vfs = require('vinyl-fs');
var through = require('through2').obj;

function mapContent(fn) {
  return through(function (file, env, cb) {
    var contents = file.contents.toString('utf8');
    var transformed = fn(contents, file);
    var output = file.clone();
    output.contents = new Buffer(transformed, 'utf8');
    cb(null, output)
  })
}

vfs.src([
  'src/**/*.js',
  '!src/optimize/babelOptions.js',
  '!src/cli/index.js',
  '!src/plugins/testsBundle/testsEntryTemplate.js',
  '!src/ui/app_entry_template.js',
])
.pipe(mapContent(require('./transforms/imports')))
.pipe(mapContent(require('./transforms/hoistPrivateProviders')))
.pipe(mapContent(require('./transforms/unwrapDefine')))
.pipe(mapContent(require('./transforms/moveInlineImports')))
.pipe(vfs.dest('src'));
