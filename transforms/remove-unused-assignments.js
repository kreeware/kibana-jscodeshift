import { initUnusedVars, closest, askForInstructions } from '../lib'
let quit = false

export default (file, api) => {
  if (quit) return file.source
  const j = api.jscodeshift

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

  const { program, unusedVars } = initUnusedVars(j, file)
  if (!program) return file.source

  unusedVars.forEach(({ path, message }) => {
    if (quit) return

    const declarator = closest([
      j.VariableDeclarator,
    ], path)

    if (!declarator) return

    const declaration = closest([
      j.VariableDeclaration,
    ], declarator)

    const editOpts = {
      '-': 'delete',
      i: 'ignore',
      q: 'quit',
    }

    if (declaration.node.declarations.length === 1) {
      editOpts.r = 'keep right side'
    }

    const instruction = askForInstructions(file, message, path, editOpts)

    if (instruction === 'q') {
      quit = true
      return
    }

    if (!instruction || instruction === '-') {
      removeDeclarator(declarator)
      return
    }

    if (instruction === 'r') {
      declaration.replace(j.expressionStatement(declarator.node.init))
      return
    }
  })

  return program.toSource()
}
