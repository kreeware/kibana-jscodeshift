import { initUnusedVars, closest } from '../lib'

export default (file, api) => {
  const j = api.jscodeshift

  const isRequireCall = node =>
    j.CallExpression.check(node) &&
    j.Identifier.check(node.callee) &&
    node.callee.name === 'require'

  const isRequireDeclarator = path =>
    isRequireCall(path.node.init) || (
      j.MemberExpression.check(path.node.init) &&
      j.Identifier.check(path.node.init.property) &&
      isRequireCall(path.node.init.object)
    )

  const removeDeclarator = declarator => {
    // each declarator is contained by a declaration, which MAY have more than
    // one declarator. If it doesn't, take out the whole declaration. Otherwise,
    // just prune our declarator
    const declaration = closest(j.VariableDeclaration, declarator)
    if (declaration.node.declarations.length === 1) {
      declaration.prune()
    } else {
      declarator.prune()
    }
  }

  const { program, unusedVars, stripUndefinedVars } = initUnusedVars(j, file.path, file.source)
  if (!program) return file.source

  unusedVars.forEach(({ path }) => {
    const declarator = closest([
      j.VariableDeclarator,
    ], path)

    if (!declarator) return
    if (!isRequireDeclarator(declarator)) return

    if (!j.ObjectPattern.check(declarator.node.id)) {
      // simple assignment, so get rid of the whole thing
      removeDeclarator(declarator)
      return
    }

    // require is destructured

    if (declarator.node.id.properties.length === 1) {
      // this object pattern only pulls out our identifier
      // so get rid of the whole thing
      removeDeclarator(declarator)
      return
    }

    // there are other assignments in this
    // object pattern, so just remove our identifier
    const properties = declarator.node.id.properties
    for (let i = 0; i < properties.length; i++) {
      if (properties[i].key.name === path.node.name) {
        properties.splice(i, 1)
        i -= 1 // recheck this index now that we removed an item
      }
    }
  })

  return stripUndefinedVars(program.toSource())
}
