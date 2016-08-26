export default (file, api) => {
  const j = api.jscodeshift

  const program = j(file.source)

  // remove bdd argument
  program.find(j.ExportDefaultDeclaration)
    .forEach(path => {
      if (!j.FunctionExpression.check(path.node.declaration)) return
      path.node.declaration.params = path.node.declaration.params.filter(p => p.name !== 'bdd')
    })

  // call global describe and it
  program.find(j.CallExpression)
    .filter(path => j.MemberExpression.check(path.node.callee) && path.node.callee.object.name === 'bdd')
    .forEach(path => path.node.callee = path.node.callee.property)

  return program.toSource()
}
