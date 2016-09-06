import { eslint, closest, shouldIgnoreNode } from '../lib'

export default (file, api) => {
  if (eslint.cli.isPathIgnored(file.path)) {
    return undefined
  }

  const j = api.jscodeshift

  const isRequireCall = node =>
    j.CallExpression.check(node) &&
    j.Identifier.check(node.callee) &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    typeof node.arguments[0].value === 'string'

  const isRequireDeclarator = node =>
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

  const program = j(file.source)

  const subjectDeclarations = program
    .find(j.VariableDeclaration)
    .filter(path => {
      const { node } = path

      if (shouldIgnoreNode(node)) {
        return false
      }

      if (!node.declarations.some(isRequireDeclarator)) {
        api.stats('non-require starndard variable declaration')
        return false
      }

      if (!node.declarations.every(isRequireDeclarator)) {
        api.stats('variable declaration with mixed require and non-require declarations')
        return false
      }

      if (node.kind !== 'const') {
        api.stats(`${node.kind} require declarations`)
        return false
      }

      if (!allDeclarationsCompatible(node)) {
        api.stats('incompatible variable declarations found?!')
        return false
      }

      return true
    })
    .paths()

  const mapToImportDeclaration = declarator => {
    if (hasDestructuringId(declarator)) {
      return j.importDeclaration(
        declarator.id.properties.map(prop =>
          j.importSpecifier(prop.key, prop.value)
        ),
        declarator.init.arguments[0]
      )
    }

    if (!hasStandardId(declarator)) {
      throw new Error('allDeclarationsCompatible() function is out of date')
    }

    return j.importDeclaration(
      [j.importDefaultSpecifier(declarator.id)],
      declarator.init.arguments[0]
    )
  }

  subjectDeclarations.forEach(path => {
    const declarations = path.node.declarations.map(mapToImportDeclaration)

    if (j.Program.check(path.parent.node)) {
      path.replace(...declarations)
      return
    }

    const prog = closest([j.Program], path)
    debugger

    // remove existing declarations, we'll put them at the top level
    path.prune()
    const hasImports = prog.node.body.some(j.ImportDeclaration.check)
    if (!hasImports) {
      prog.node.body.unshift(...declarations)
      return
    }

    for (let i = prog.node.body.length - 1; i >= 0; i--) {
      const node = prog.node.body[i]
      if (j.ImportDeclaration.check(node)) {
        prog.node.body.splice(i + 1, 0, ...declarations)
        break
      }
    }
  })

  return program.toSource()
}
