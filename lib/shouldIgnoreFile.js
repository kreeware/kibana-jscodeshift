import { eslint } from './'

export const shouldIgnoreFile = ({ path, source }) => {
  if (eslint.cli.isPathIgnored(path)) {
    return true
  }

  return source.startsWith('// kibana-jscodeshift-ignore-file')
}
