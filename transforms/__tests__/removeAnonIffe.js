/* eslint-env mocha */

import jscodeshift from 'jscodeshift'
import test from 'ava'

import removeAnonIffe from '../removeAnonIffe'

const transform = source => removeAnonIffe({
  source,
  path: 'some test file',
  jscodeshift,
  stats: () => {},
})

test('removes IIFE wrappers that have and take no arguments', t => {
  t.is(
    transform([
      '(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '}())',
    ].join('\n')),
    [
      'console.log("foo");',
      'console.log("bar");',
    ].join('\n')
  )
})

test('removes IIFE with parens on the outside', t => {
  t.is(
    transform([
      '(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '})()',
    ].join('\n')),
    [
      'console.log("foo");',
      'console.log("bar");',
    ].join('\n')
  )
})

test('skips function expression that is not executed', t => {
  t.is(
    transform([
      '(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '})',
    ].join('\n')),
    [
      '(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '})',
    ].join('\n')
  )
})

test('skips IIFE that sends args', t => {
  t.is(
    transform([
      '(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '})(arg1, arg2)',
    ].join('\n')),
    [
      '(function () {',
      '  console.log("foo");',
      '  console.log("bar");',
      '})(arg1, arg2)',
    ].join('\n')
  )
})

test('skips IIFE that takes args', t => {
  t.is(
    transform([
      '(function (arg1, arg2) {',
      '  console.log("foo");',
      '  console.log("bar");',
      '}())',
    ].join('\n')),
    [
      '(function (arg1, arg2) {',
      '  console.log("foo");',
      '  console.log("bar");',
      '}())',
    ].join('\n')
  )
})
