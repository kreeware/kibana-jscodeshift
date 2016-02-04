var _ = require('lodash');
var injectNewImports = require('../lib/injectNewImports');

var templateRE = /((template|editor)\:\s*)require\(('[^']+\.html')\)/g;

var replacements = [
  { module: 'ui/routes', newName: 'uiRoutes' },
  { module: 'ui/modules', newName: 'uiModules' },
  { module: 'ui/registry/_registry', newName: 'uiRegistry' },
  { module: 'ui/stringify/types/Url', newName: 'stringifyUrl' },
  { module: 'ui/stringify/types/Bytes', newName: 'stringifyBytes' },
  { module: 'ui/stringify/types/Date', newName: 'stringifyDate' },
  { module: 'ui/stringify/types/Ip', newName: 'stringifyIp' },
  { module: 'ui/stringify/types/Number', newName: 'stringifyNumber' },
  { module: 'ui/stringify/types/Percent', newName: 'stringifyPercent' },
  { module: 'ui/stringify/types/String', newName: 'stringifyString' },
  { module: 'ui/stringify/types/Source', newName: 'stringifySource' },
  { module: 'ui/stringify/types/Color', newName: 'stringifyColor' },
  { module: 'ui/stringify/types/truncate', newName: 'stringifyTruncate' }
];

replacements.forEach(function (r) {
  r.re = new RegExp(`require\\('${_.escapeRegExp(r.module)}'\\)`, 'g');
});

module.exports = function (contents) {
  var newImports = [];

  replacements.forEach(function (r) {
    var found = false;
    contents = contents.replace(r.re, function () {
      if (!found) {
        found = true;
        newImports.push(`import ${r.newName} from '${r.module}';`);
      }

      return r.newName;
    });
  })

  contents = contents.replace(templateRE, function (all, property, name, location) {
    var varName = _.chain(location)
    .split(/\/|\./)
    .slice(-2, -1)
    .map(_.camelCase)
    .concat('Template')
    .join('')
    .value();

    newImports.push(`import ${varName} from ${location};`);
    return `${name}: ${varName}`;
  });

  return injectNewImports(newImports, contents);
}
