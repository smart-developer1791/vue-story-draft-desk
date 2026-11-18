import { customRef, computed } from 'vue'
import { parseWorkspace, type Workspace } from '../domain/story.ts'
import { single } from '../domain/shared.ts'
export function useHistory(initial: unknown, limit = 30) {
  if (!Number.isInteger(limit) || limit < 2 || limit > 30)
    throw new Error('History limit must be from 2 to 30.')
  let snapshots = [{ value: Object.freeze(parseWorkspace(initial)), label: 'Loaded draft' }],
    cursor = 0,
    pending = 'Saved draft',
    publish = () => {}
  const model = customRef<Workspace>((track, trigger) => {
    publish = trigger
    return {
      get() {
        track()
        return snapshots[cursor]!.value
      },
      set(value) {
        const next = Object.freeze(parseWorkspace(value))
        const label = pending
        pending = 'Saved draft'
        if (JSON.stringify(next) === JSON.stringify(snapshots[cursor]!.value)) return
        snapshots = snapshots.slice(0, cursor + 1)
        snapshots.push({ value: next, label })
        if (snapshots.length > limit) snapshots.shift()
        cursor = snapshots.length - 1
        trigger()
      },
    }
  })
  const entries = computed(() => {
    void model.value
    return snapshots.map((s, index) => ({
      index,
      label: s.label,
      title: s.value.name,
      characters: s.value.body.length,
      current: index === cursor,
    }))
  })
  const canUndo = computed(() => {
      void model.value
      return cursor > 0
    }),
    canRedo = computed(() => {
      void model.value
      return cursor < snapshots.length - 1
    })
  function commit(value: unknown, label = 'Saved draft') {
    const next = parseWorkspace(value)
    pending = single(label, 'Snapshot label', 40)
    model.value = next
  }
  function jump(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= snapshots.length || index === cursor)
      return false
    cursor = index
    publish()
    return true
  }
  function reset(value: unknown) {
    const next = Object.freeze(parseWorkspace(value))
    snapshots = [{ value: next, label: 'Loaded draft' }]
    cursor = 0
    pending = 'Saved draft'
    publish()
  }
  return {
    model,
    entries,
    canUndo,
    canRedo,
    commit,
    jump,
    undo: () => jump(cursor - 1),
    redo: () => jump(cursor + 1),
    reset,
  }
}
