export default ({ jscodeshift, source }) => {
  const { CallExpression, FunctionExpression } = jscodeshift.types.namedTypes

  const replace = ex => {
    // we only care about CallExpression...
    const callPath = ex.get('expression')
    const call = callPath.node
    if (!CallExpression.check(call)) return false

    // ...that don't pass any arguments...
    if (call.arguments.length > 0) return false

    // ...to FunctionExpressions...
    const fnPath = callPath.get('callee')
    const fn = fnPath.node
    if (!FunctionExpression.check(fn)) return false

    // ...that don't receive any arguments
    if (fn.params.length > 0) return false

    return fnPath.get('body', 'body').value
  }

  return jscodeshift(source)
  .forEach(root => {
    jscodeshift.types.visit(root, {
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
