import { initUnusedVars, closest } from '../lib'

export default (file, api) => {
  const j = api.jscodeshift

  const { program, unusedVars, stripUndefinedVars } = initUnusedVars(j, file.path, file.source)
  if (!unusedVars) return file.source

  const isInitializedTo = (path, types) =>
    types.some(T => T.check(path.node.init))

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

  class Nothing {
    static check(node) {
      return (!node)
    }
  }

  class EmptyArrayExpression {
    static check(node) {
      return (
        j.ArrayExpression.check(node) &&
        node.elements.length === 0
      )
    }
  }

  class EmptyObjectExpression {
    static check(node) {
      return (
        j.ObjectExpression.check(node) &&
        node.properties.length === 0
      )
    }
  }

  class WhitelistedFunction {
    static whitelist = [
      'promisify',
      'Private',
    ]
    static check(node) {
      return (
        j.CallExpression.check(node) &&
        j.Identifier.check(node.callee) &&
        WhitelistedFunction.whitelist.includes(node.callee.name)
      )
    }
  }

  class NonEvaluated {
    static check(node) {
      return [
        j.Identifier,
        j.ThisExpression,
        j.Literal,
        EmptyArrayExpression,
        EmptyObjectExpression,
        WhitelistedFunction,
      ].some(T => T.check(node))
    }
  }

  class NonEvaluatedMemberExpression {
    static check(node) {
      return (
        j.MemberExpression.check(node) &&
        NonEvaluated.check(node.property) && (
          NonEvaluated.check(node.object) ||
          NonEvaluatedMemberExpression.check(node.object)
        )
      )
    }
  }

  unusedVars.forEach(({ path }) => {
    const declarator = closest([
      j.VariableDeclarator,
    ], path)

    if (!declarator) return

    if (j.ObjectPattern.check(declarator.node.id) && declarator.node.id.properties.length > 1) {
      // just remove the one property from the multi-property destructure
      const properties = declarator.node.id.properties
      for (let i = 0; i < properties.length; i++) {
        if (properties[i].key.name === path.node.name) {
          properties.splice(i, 1)
          i -= 1 // recheck this index now that we removed an item
        }
      }
      return
    }

    const notEvaluation = isInitializedTo(declarator, [
      Nothing,
      NonEvaluated,
      NonEvaluatedMemberExpression,
    ])

    if (notEvaluation) {
      removeDeclarator(declarator)
      return
    }
  })

  return stripUndefinedVars(program.toSource())
}
