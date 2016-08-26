export const logContext = (file, path, lines, prefix = '') => {
  const loc = path.parent.node.loc || path.node.loc
  const firstLine = loc.start.line - 1
  const lastLine = loc.end.line - 1
  file.source.split(/\r?\n/).forEach((line, i) => {
    if (i < firstLine) {
      if (i - firstLine > -lines) {
        console.log(prefix, ' ', line)
      }
    } else if (i > lastLine) {
      if (i - lastLine < lines) {
        console.log(prefix, ' ', line)
      }
    } else {
      console.log(prefix, '>', line)
    }
  })
}
