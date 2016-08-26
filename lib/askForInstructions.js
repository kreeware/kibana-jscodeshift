import readlineSync from 'readline-sync'

import { logContext } from './logContext'

export const askForInstructions = (file, message, path, options) => {
  console.log(' >>', file.path)
  console.log('   ', message.message)
  logContext(file, path, 2, '    ')
  const shortOpts = Object.keys(options)

  const ask = () => {
    const answer = readlineSync.question(
      `What should I do with this? [${shortOpts.concat('?').join('')}]`
    )

    if (answer === '?') {
      shortOpts.forEach(o => {
        console.log(o, '=', options[o])
      })
      console.log()
      return ask()
    }

    if (!options[answer]) {
      console.log('unknown answer', answer)
      return ask()
    }

    console.log()
    return answer
  }

  return ask()
}
