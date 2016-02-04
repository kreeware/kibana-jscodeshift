module.exports = function (contents) {
  return contents
  .replace(/^module\.exports\s+=\s+/g, 'export default ')
  .replace(/^exports\.([a-zA-Z0-9_$]+)\s+=/g, 'export const $1 = ');
}
