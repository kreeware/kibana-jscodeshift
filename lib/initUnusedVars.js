import { cli, linter } from './eslint'

export function initUnusedVars(j, filename, source) {
  if (cli.isPathIgnored(filename)) {
    return {}
  }

  const baseConfig = cli.getConfigForFile(filename)
  const messages = linter.verify(source, {
    ...baseConfig,
    rules: {
      ...baseConfig.rules,
      'no-unused-vars': [2],
    },
  }, { filename })

  const program = j(source)
  const identifiers = program.find(j.Identifier).paths()

  return {
    program,
    unusedVars: messages
      .filter(m => m.ruleId === 'no-unused-vars')
      .map(message => {
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
