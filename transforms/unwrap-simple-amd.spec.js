/* eslint-env mocha */

import jscodeshift from 'jscodeshift'
import test from 'ava'

import unwrapSimpleAmd from './unwrap-simple-amd'

const api = {
  jscodeshift,
  stats: () => {},
}

const transform = source =>
  unwrapSimpleAmd(
    { source, path: 'some test file' },
    api
  )

test('removes amd wrapper', t => {
  t.is(
    transform([
      'define(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '})',
    ].join('\n')),
    [
      'console.log("foo");',
      'console.log("bar");',
    ].join('\n')
  )
})

test('converts return statements to `export default` statement', t => {
  t.is(
    transform([
      'define(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '  return 1',
      '})',
    ].join('\n')),
    [
      'console.log("foo");',
      'console.log("bar");',
      'export default 1;',
    ].join('\n')
  )
})
