import { cli } from './eslint'
import { closest } from './closest'

export function initUnusedVars(j, filename, source) {
  if (cli.isPathIgnored(filename)) {
    return {}
  }

  const report = cli.executeOnText(source, filename)
  const messages = report.results[0].messages

  const program = j(source)
  const identifiers = program.find(j.Identifier).paths()

  const undef = messages.filter(m => m.ruleId === 'no-undef')
  if (undef.length) {
    throw new TypeError('File has undefined variables!')
  }

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

    stripUndefinedVars(sourceWithoutUnused) {
      const reportWithoutUnused = cli.executeOnText(sourceWithoutUnused, filename)
      const undefMessages = reportWithoutUnused.results[0].messages

      const programWithoutUnused = j(sourceWithoutUnused)
      const identifiersWithoutUnused = programWithoutUnused.find(j.Identifier).paths()

      undefMessages
        .filter(m => m.ruleId === 'no-undef')
        .forEach(message => {
          const path = identifiersWithoutUnused.find(i => {
            const loc = i.node.loc
            return (
              loc &&
              loc.start &&
              message.line === loc.start.line &&
              message.column === loc.start.column + 1
            )
          })

          closest([j.Expression], path).prune()
        })

      return programWithoutUnused.toSource()
    },
  }
}
