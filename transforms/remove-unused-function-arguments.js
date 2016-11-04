import { askForInstructions, initUnusedVars, closest } from '../lib'

const STEP_THROUGH = false
let quit = false

export default (file, api) => {
  if (quit) return file.source

  const j = api.jscodeshift

  function applyFix(source) {
    const { program, unusedVars, stripUndefinedVars } = initUnusedVars(j, file.path, source)
    if (!unusedVars) return false

    const removeParam = (fn, param) => {
      for (let i = 0; i < fn.node.params.length; i++) {
        if (fn.node.params[i] === param.node) {
          fn.node.params.splice(i, 1)
          i -= 1 // retest this index now that it's a different
        }
      }
    }

    unusedVars.forEach(({ message, path }) => {
      if (quit) return

      // our identifier should have a function of some sort as a direct parent
      const fnDef = closest([
        j.ArrowFunctionExpression,
        j.FunctionExpression,
        j.MethodDefinition,
        j.FunctionDeclaration,
      ], path)

      if (
        !fnDef ||
        path.parent !== fnDef ||
        !fnDef.node.params.includes(path.node)
      ) {
        return
      }

      if (!STEP_THROUGH) {
        removeParam(fnDef, path)
        return
      }

      const ignoreByName = [
        'event',
        'i',
        'Private',
        'attr',
        'attrs',
        '$attrs',
        '$attr',
        '$injector',
        '$el',
        '$element',
        'options',
        '$compile',
        'err',
        'error',
        'resp',
        'server',
        '$rootScope',
        'reject',
      ]

      if (ignoreByName.includes(path.node.name)) {
        removeParam(fnDef, path)
        return
      }

      const instruction = askForInstructions(file, message, path, {
        '': 'delete',
        '-': 'delete',
        i: 'ignore',
        q: 'quit',
      })

      if (instruction === 'q') {
        quit = true
        return
      }

      if (!instruction || instruction === '-') {
        removeParam(fnDef, path)
        return
      }
    })

    return stripUndefinedVars(program.toSource())
  }

  return (function doPass(source) {
    const fixedSource = applyFix(source)
    if (!fixedSource || fixedSource === source) {
      return source
    }

    return doPass(fixedSource)
  }(file.source))
}
