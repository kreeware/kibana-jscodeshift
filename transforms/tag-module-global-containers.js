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

  const program = j(file.source)

  const rootDeclarations = program
    .find(j.VariableDeclaration)
    .filter(path => j.Program.check(path.parent.node))

  const defs = []

  rootDeclarations.forEach(path => {
    path.node.declarations.forEach(dec => {
      if (isRequireDeclaration(dec)) return

      if (j.ObjectPattern.check(dec.id)) {
        dec.id.properties.forEach(p => {
          defs.push(j.property(
            'init',
            j.literal(p.value.name),
            j.arrowFunctionExpression(
              [],
              p.value,
              true
            )
          ))
        })
      } else {
        defs.push(j.property(
          'init',
          j.literal(dec.id.name),
          j.arrowFunctionExpression(
            [],
            dec.id,
            true
          )
        ))
      }
    })
  })

  if (defs.length) {
    program.find(j.Program).forEach(p =>
      p.node.body.push(
        j.expressionStatement(
          j.assignmentExpression(
            '=',
            j.memberExpression(
              j.memberExpression(
                j.identifier('window'),
                j.identifier('__moduleGlobals__')
              ),
              j.literal(file.path)
            ),
            j.objectExpression(defs)
          )
        )
      )
    )

    return program.toSource()
  }
}
