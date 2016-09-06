export default (file, api) => {
  const j = api.jscodeshift

  const replace = ex => {
    // we only care about CallExpression...
    const callPath = ex.get('expression')
    const call = callPath.node
    if (!j.CallExpression.check(call)) return false

    // ...that don't pass any arguments...
    if (call.arguments.length > 0) return false

    // ...to FunctionExpressions...
    const fnPath = callPath.get('callee')
    const fn = fnPath.node
    if (!j.FunctionExpression.check(fn)) return false

    // ...that don't receive any arguments
    if (fn.params.length > 0) return false

    // ...or have a name
    if (fn.id && fn.id.name) return false

    return fnPath.get('body', 'body').value
  }

  return j(file.source)
  .forEach(root => {
    j.types.visit(root, {
      visitExpressionStatement(path) {
        const replacements = replace(path)
        if (replacements) {
          path.replace(...replacements)
          this.traverse(path.parent)
        } else {
          this.traverse(path)
        }
      },
    })
  })
  .toSource()
}
