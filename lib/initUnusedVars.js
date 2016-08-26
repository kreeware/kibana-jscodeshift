import { resolve } from 'path'

const { CLIEngine, linter } = require(resolve('node_modules/eslint'))

const cli = new CLIEngine({
  ignore: true,
  eslintrc: false,
})

export function initUnusedVars(j, file) {
  if (cli.isPathIgnored(file.path)) {
    return {}
  }

  const baseConfig = cli.getConfigForFile(file.path)
  const messages = linter.verify(file.source, {
    ...baseConfig,
    rules: {
      'no-unused-vars': [2],
    },
  }, { filename: file.path, allowInlineConfig: false })

  const program = j(file.source)
  const identifiers = program.find(j.Identifier).paths()

  return {
    program,
    unusedVars: messages.map(message => {
      const path = identifiers.find(i => {
        const loc = i.node.loc
        return (
          loc &&
          loc.start &&
          message.line === loc.start.line &&
          message.column === loc.start.column + 1
        )
      })

      return { path, message }
    }),
  }
}
