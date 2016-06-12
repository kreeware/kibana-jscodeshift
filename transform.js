import removeAnonIffe from './transforms/removeAnonIffe'

const transforms = [
  removeAnonIffe,
]

// jscodeshift requires module.exports
module.exports = (file, api) =>
  transforms.reduce(
    (source, transform) =>
      transform({ ...file, ...api, source }),

    file.source
  )
