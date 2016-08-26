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

  const isRequireDeclaration = node =>
    j.VariableDeclarator.check(node) &&
    isRequireCall(node.init)

  const hasDestructuringId = node =>
    j.ObjectPattern.check(node.id)

  const hasStandardId = node =>
    j.Identifier.check(node.id)

  const allDeclarationsCompatible = node =>
    node.declarations.every(dec =>
      hasStandardId(dec) || hasDestructuringId(dec)
    )

  return j(file.source)
    .find(j.VariableDeclaration)
    .filter(path => {
      const { node } = path

      if (!node.declarations.some(isRequireDeclaration)) {
        api.stats('non-require starndard variable declaration')
        return false
      }

      if (!node.declarations.every(isRequireDeclaration)) {
        api.stats('variable declaration with mixed require and non-require declarations')
        return false
      }

      if (node.kind !== 'const') {
        api.stats(`${node.kind} require declarations`)
        return false
      }

      if (allDeclarationsCompatible(node)) {
        api.stats('incompatible variable declarations found?!')
        return false
      }

      return true
    })
    .replaceWith(path => path.node.declarations
      .map(dec => {
        if (hasDestructuringId(dec)) {
          return j.importDeclaration(
            dec.id.properties.map(prop =>
              j.importSpecifier(prop.key, prop.value)
            ),
            dec.init.arguments[0]
          )
        }

        if (!hasStandardId(dec)) {
          throw new Error('allDeclarationsCompatible() function is out of date')
        }

        return j.importDeclaration(
          [j.importDefaultSpecifier(dec.id)],
          dec.init.arguments[0]
        )
      })
    )
    .toSource()
}
