import { resolve } from 'path'

const { CLIEngine, linter } = require(resolve('node_modules/eslint'))

const cli = new CLIEngine({
  ignore: true,
  eslintrc: false,
})

export { linter, cli }
