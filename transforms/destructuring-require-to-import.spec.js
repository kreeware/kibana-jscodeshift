import jscodeshift from 'jscodeshift'
import test from 'ava'

import destructuringRequireToImport from './destructuring-require-to-import'

const api = {
  jscodeshift,
  stats: () => {},
}


const transform = source =>
  destructuringRequireToImport(
    { source, path: 'some test file' },
    api
  )

const lines = txt => {
  let gutter = undefined
  return txt
    .split('\n')
    .reduce((acc, line) => {
      if (gutter === undefined && !line.trim()) return acc
      if (gutter === undefined) {
        gutter = line.match(/^\s+/).length
      }
      return [...acc, line.slice(gutter)]
    })
    .join('\n')
}


test('rewrites requires with a single target', t => {
  t.is(
    transform(`const { foo } = require('bar');`),
    `import {foo} from 'bar';`
  )
})

test('rewrites requires with multiple targets', t => {
  t.is(
    transform(`const { foo, baz } = require('bar');`),
    `import {foo, baz} from 'bar';`
  )
})

test('rewrites requires with local aliases targets', t => {
  t.is(
    transform(`const { foo: baz, bax, box: foo } = require('bar');`),
    `import {foo as baz, bax, box as foo} from 'bar';`
  )
})

test('rewrites standard requires', t => {
  t.is(
    transform(`const bar = require('bar');')`),
    `import bar from 'bar';`
  )
})

test('rewrites multiple declarations into multiple imports', t => {
  t.is(
    transform(`const bar = require('bar'), baz = require('baz');`),
    lines(`
      import bar from 'bar';
      import baz from 'baz';
    `)
  )
})

test('ignores non-const requires', t => {
  t.is(
    transform(`let { bar } = require('bar');`),
    `let { bar } = require('bar');`
  )
})
