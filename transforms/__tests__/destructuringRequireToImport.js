import jscodeshift from 'jscodeshift'
import test from 'ava'

import destructuringRequireToImport from '../destructuringRequireToImport'

const transform = source => destructuringRequireToImport({
  source,
  path: 'some test file',
  jscodeshift,
  stats: () => {},
})

test('rewrites requires with a single target', t => {
  t.is(
    transform('const { foo } = require(\'bar\');'),
    'import {foo} from \'bar\';'
  )
})

test('rewrites requires with multiple targets', t => {
  t.is(
    transform('const { foo, baz } = require(\'bar\');'),
    'import {foo, baz} from \'bar\';'
  )
})

test('rewrites requires with local aliases targets', t => {
  t.is(
    transform('const { foo: baz, bax, box: foo } = require(\'bar\');'),
    'import {foo as baz, bax, box as foo} from \'bar\';'
  )
})

test('ignores plain requires', t => {
  t.is(
    transform('const bar = require(\'bar\');'),
    'const bar = require(\'bar\');'
  )
})

test('ignores non-const requires', t => {
  t.is(
    transform('let { bar } = require(\'bar\');'),
    'let { bar } = require(\'bar\');'
  )
})
