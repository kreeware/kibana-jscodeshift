var _ = require('lodash');
var injectNewImports = require('../lib/injectNewImports');
var replacements = [
  ['ui/routes', 'UiRoutes'],
  ['ui/modules', 'UiModules']
];

module.exports = function (contents) {
  var newImports = [];

  replacements.forEach(function (pair) {
    var module = pair[0];
    var newName = pair[1];

    var found = false;
    var re = new RegExp(`require\\('${_.escapeRegExp(module)}'\\)`, 'g');
    contents = contents.replace(re, function () {
      if (!found) {
        found = true;
        newImports.push(`import ${newName} from '${module}';`);
      }

      return newName;
    });
  })

  return injectNewImports(newImports, contents);
}
