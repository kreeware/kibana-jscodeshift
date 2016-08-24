export default ({ jscodeshift, source }) => {
  const {
    CallExpression,
    Identifier,
    VariableDeclarator,
    ObjectPattern,
    VariableDeclaration,
    importDeclaration,
    importSpecifier,
  } = jscodeshift

  const isRequireCall = node =>
    CallExpression.check(node) &&
    Identifier.check(node.callee) &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    typeof node.arguments[0].value === 'string'

  const isDestructuringRequireStatement = node =>
    node.declarations.length === 1 &&
    node.kind === 'const' &&
    node.declarations.every(dec => (
      VariableDeclarator.check(dec) &&
      ObjectPattern.check(dec.id) &&
      isRequireCall(dec.init)
    ))

  return jscodeshift(source)
    .find(VariableDeclaration, isDestructuringRequireStatement)
    .replaceWith(path => {
      const dec = path.value.declarations[0]
      return importDeclaration(
        dec.id.properties.map(prop =>
          importSpecifier(prop.key, prop.value)
        ),
        dec.init.arguments[0]
      )
    })
    .toSource()
}
