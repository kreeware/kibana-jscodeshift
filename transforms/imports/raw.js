var re = /^require\(([^\)]+)\);/gm;

module.exports = function (contents) {
  return contents.replace(re, 'import $1;');
};
