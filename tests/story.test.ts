import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { watch, effectScope, nextTick, isReactive } from 'vue'
import {
  sample,
  parseWorkspace,
  paragraphs,
  statistics,
  exportWorkspace,
  exportText,
} from '../src/domain/story.ts'
import { useHistory } from '../src/composables/useHistory.ts'
test('sample and canonical provenance round-trip while newlines normalize', () => {
  const fixture = JSON.parse(
    readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
  )
  assert.deepEqual(exportWorkspace(sample), fixture)
  assert.deepEqual(parseWorkspace(fixture), sample)
  assert.equal(
    parseWorkspace({ ...sample, body: 'One\r\n\r\nTwo\rThree' }).body,
    'One\n\nTwo\nThree',
  )
  assert.notEqual(
    exportWorkspace({ ...sample, body: 'New' }).provenance.marker,
    fixture.provenance.marker,
  )
})
test('schema accepts empty body but rejects malformed fields and oversized prose', () => {
  assert.equal(parseWorkspace({ ...sample, body: '', subtitle: '' }).body, '')
  for (const value of [
    { ...sample, name: ['x'] },
    { ...sample, name: '' },
    { ...sample, body: ['text'] },
    { ...sample, body: 'x'.repeat(10001) },
    { ...sample, body: '\u0000' },
    { ...sample, name: 'two\nlines' },
  ])
    assert.throws(() => parseWorkspace(value))
})
test('paragraph and whitespace word counts are deterministic and text export keeps literal content', () => {
  assert.deepEqual(paragraphs('One\n\n Two \n\n\nThree'), ['One', 'Two', 'Three'])
  assert.deepEqual(statistics(' Hello there.\n\nA little thought.'), {
    words: 5,
    characters: 32,
    paragraphs: 2,
  })
  const txt = exportText({ ...sample, body: '<script>is plain text</script>' })
  assert.ok(txt.includes('<script>is plain text</script>'))
  assert.match(txt, /SD-[A-F0-9]{8}/)
})
test('customRef publishes frozen snapshots, rejects invalid commits, and skips duplicates', async () => {
  const scope = effectScope(),
    history = scope.run(() => useHistory(sample))!
  let observed = 0
  scope.run(() => watch(history.model, () => observed++))
  assert.equal(isReactive(history.model.value), false)
  assert.ok(Object.isFrozen(history.model.value))
  history.commit({ ...sample, body: 'A changed paragraph' }, 'First edit')
  await nextTick()
  assert.equal(observed, 1)
  assert.equal(history.entries.value.length, 2)
  const before = history.model.value
  assert.throws(() => history.commit({ ...sample, name: '' }, 'Invalid'))
  assert.equal(history.model.value, before)
  assert.throws(() => {
    history.model.value.body = 'Mutation'
  })
  history.commit(history.model.value, 'Same content')
  await nextTick()
  assert.equal(observed, 1)
  assert.equal(history.entries.value.length, 2)
  scope.stop()
})
test('undo/redo and jumping publish real Vue ref values while saving after undo replaces the branch', () => {
  const history = useHistory(sample)
  history.commit({ ...sample, body: 'First' }, 'One')
  history.commit({ ...sample, body: 'Second' }, 'Two')
  assert.equal(history.undo(), true)
  assert.equal(history.model.value.body, 'First')
  assert.equal(history.canRedo.value, true)
  assert.equal(history.redo(), true)
  assert.equal(history.model.value.body, 'Second')
  history.undo()
  history.commit({ ...sample, body: 'Different branch' }, 'Branch')
  assert.equal(history.canRedo.value, false)
  assert.equal(history.entries.value.length, 3)
  assert.equal(history.jump(0), true)
  assert.equal(history.model.value.body, sample.body)
  assert.equal(history.jump(99), false)
})
test('bounded history evicts old snapshots and validated imports reset it atomically', () => {
  const history = useHistory(sample, 3)
  for (let i = 0; i < 4; i++) history.commit({ ...sample, body: `Version ${i}` }, `Edit ${i}`)
  assert.equal(history.entries.value.length, 3)
  history.undo()
  history.undo()
  assert.equal(history.model.value.body, 'Version 1')
  assert.equal(history.canUndo.value, false)
  const before = history.model.value
  assert.throws(() => history.reset({ ...sample, name: '' }))
  assert.equal(history.model.value, before)
  history.reset({ ...sample, body: 'Imported' })
  assert.equal(history.entries.value.length, 1)
  assert.equal(history.model.value.body, 'Imported')
  assert.equal(history.canRedo.value, false)
})
