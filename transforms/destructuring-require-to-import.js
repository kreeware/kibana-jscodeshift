export default (file, api) => {
  const j = api.jscodeshift

  const isRequireCall = node =>
    j.CallExpression.check(node) &&
    j.Identifier.check(node.callee) &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    typeof node.arguments[0].value === 'string'

  const isDestructuringRequireStatement = node =>
    node.declarations.length === 1 &&
    node.kind === 'const' &&
    node.declarations.every(dec => (
      j.VariableDeclarator.check(dec) &&
      j.ObjectPattern.check(dec.id) &&
      isRequireCall(dec.init)
    ))

  return j(file.source)
    .find(j.VariableDeclaration, isDestructuringRequireStatement)
    .replaceWith(path => {
      const dec = path.value.declarations[0]
      return j.importDeclaration(
        dec.id.properties.map(prop =>
          j.importSpecifier(prop.key, prop.value)
        ),
        dec.init.arguments[0]
      )
    })
    .toSource()
}
