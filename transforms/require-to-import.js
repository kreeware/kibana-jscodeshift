import { closest, shouldIgnoreNode, shouldIgnoreFile } from '../lib'

export default (file, api) => {
  if (shouldIgnoreFile(file)) {
    return undefined
  }

  const j = api.jscodeshift

  const isRequireNode = node =>
    j.Identifier.check(node) &&
    node.type === 'Identifier' &&
    node.name === 'require'

  const isStringLiteralNode = node =>
    node.type === 'Literal' &&
    typeof node.value === 'string'

  const isRequireCall = node =>
    j.CallExpression.check(node) &&
    isRequireNode(node.callee) &&
    node.arguments.length === 1 &&
    isStringLiteralNode(node.arguments[0])

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
      let cursor = path
      do {
        const containingFunc = closest([j.Function], cursor)

        // remove all paths where require is defined as a parameter to a containing function
        if (containingFunc && containingFunc.node.params.some(isRequireNode)) {
          console.log('path is within a function that injects require', file.path)
          return false
        }

        cursor = containingFunc
      } while (cursor && !j.Program.check(cursor.parent.node))

      return true
    })
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

    if (path.node.comments) {
      declarations[0].comments = path.node.comments
    }

    if (j.Program.check(path.parent.node)) {
      path.replace(...declarations)
      return
    }

    const prog = closest([j.Program], path)

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
