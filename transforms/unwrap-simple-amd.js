export default (file, api) => {
  const j = api.jscodeshift

  const isAmd = node =>
    j.CallExpression.check(node) &&
    j.Identifier.check(node.callee) &&
    node.callee.name === 'define' &&
    node.arguments.length === 1 &&
    j.FunctionExpression.check(node.arguments[0])

  // unwrap the define() bit
  return j(file.source)
    .find(j.ExpressionStatement)
    .filter(path => j.Program.check(path.parent.node) && isAmd(path.node.expression))
    .replaceWith(path => path.node.expression.arguments[0].body.body.map(stmt => {
      if (j.ReturnStatement.check(stmt)) {
        return j.exportDefaultDeclaration(stmt.argument)
      }

      return stmt
    }))
    .toSource()
}
