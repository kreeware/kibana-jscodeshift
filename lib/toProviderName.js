var _ = require('lodash');

module.exports = function toProviderName(location) {
  return _.chain(location)
  .words()
  .map(_.lowerCase)
  .difference(['ui'])
  .map(_.upperFirst)
  .concat(['Provider'])
  .join('')
  .value();
}
