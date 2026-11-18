<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import { useDraft } from './services/draft'
import { download } from './services/files'
import {
  sample,
  parseWorkspace,
  paragraphs,
  statistics,
  exportWorkspace,
  exportText,
} from './domain/story'
import { useHistory } from './composables/useHistory'
const { draft, storageStatus } = useDraft('vue-story-draft-desk:v1', sample, parseWorkspace)
const history = useHistory(draft.value)
const current = history.model,
  entries = history.entries,
  canUndo = history.canUndo,
  canRedo = history.canRedo
const editor = ref({ ...current.value }),
  label = ref(''),
  error = ref(''),
  notice = ref(''),
  confirm = ref(false)
let pending = () => {}
watch(current, (value) => {
  draft.value = value
  editor.value = { ...value }
  error.value = ''
})
const dirty = computed(() => JSON.stringify(editor.value) !== JSON.stringify(current.value)),
  stats = computed(() => statistics(editor.value.body))
const marker = computed(() => exportWorkspace(current.value).provenance.marker)
function save() {
  try {
    const before = current.value
    history.commit(editor.value, label.value.trim() || 'Saved draft')
    editor.value = { ...current.value }
    error.value = ''
    notice.value = before === current.value ? 'No text changes to save.' : 'Snapshot saved.'
    label.value = ''
  } catch (e) {
    error.value = (e as Error).message
    notice.value = ''
  }
}
function load(action: () => unknown) {
  const run = () => {
    action()
    editor.value = { ...current.value }
    error.value = ''
    notice.value = ''
    confirm.value = false
  }
  if (dirty.value) {
    pending = run
    confirm.value = true
  } else run()
}
function accept() {
  pending()
  pending = () => {}
}
function replace(value: unknown) {
  const w = parseWorkspace(value)
  history.reset(w)
  draft.value = w
  editor.value = { ...w }
  label.value = ''
  error.value = ''
  notice.value = ''
  confirm.value = false
  pending = () => {}
}
const serialize = (value: unknown) => exportWorkspace(parseWorkspace(value))
function saveText() {
  download(`${marker.value}.txt`, exportText(current.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div
    data-project="vue-story-draft-desk"
    data-author="CodeSculptor"
    :data-marker="marker"
    class="min-h-screen"
  >
    <StudioHeader
      title="Story Draft Desk"
      subtitle="A small page for a thought taking shape."
      code="SD"
      ><DataTools
        :workspace="current"
        :sample="sample"
        :parse="parseWorkspace"
        :serialize="serialize"
        @replace="replace"
        ><button
          class="border-accent! bg-accent text-on-accent hover:brightness-110"
          @click="saveText"
        >
          Text
        </button></DataTools
      ></StudioHeader
    >
    <main class="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0">
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            MAKE A LITTLE SPACE FOR THE WORDS
          </p>
          <h1 class="max-w-4xl break-words text-3xl font-semibold leading-tight sm:text-4xl">
            {{ current.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Write a little, keep a version, and follow the sentence somewhere new.
          </p>
        </div>
        <span class="rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted">{{
          storageStatus
        }}</span>
      </div>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]"
      >
        <section
          data-ui="story-editor"
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="editor-heading"
        >
          <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 id="editor-heading" class="text-lg font-semibold">The next draft</h2>
            <span
              data-ui="draft-state"
              class="rounded-full bg-soft px-3 py-1.5 text-xs text-accent"
              >{{ dirty ? 'Pending edits' : 'Current snapshot' }}</span
            >
          </div>
          <form @submit.prevent="save">
            <label>Story title<input v-model="editor.name" maxlength="80" /></label
            ><label class="mt-4">Subtitle<input v-model="editor.subtitle" maxlength="160" /></label
            ><label class="mt-4"
              >Story text<textarea
                v-model="editor.body"
                maxlength="10000"
                spellcheck="true"
                class="h-[300px] resize-none leading-relaxed!"
              />
            </label>
            <div class="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
              <span>{{ stats.words }} words · {{ stats.paragraphs }} paragraphs</span
              ><span>{{ stats.characters }} / 10,000</span>
            </div>
            <label class="mt-4"
              >Snapshot label<input
                v-model="label"
                maxlength="40"
                placeholder="A clearer opening, a new ending…"
            /></label>
            <p class="mt-3 h-12 overflow-auto text-xs leading-relaxed text-danger" role="alert">
              {{ error }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                type="submit"
                class="border-accent! bg-accent text-on-accent hover:brightness-110"
              >
                Save snapshot</button
              ><button
                type="button"
                class="hover:bg-soft"
                :disabled="!canUndo"
                @click="load(history.undo)"
              >
                Undo</button
              ><button
                type="button"
                class="hover:bg-soft"
                :disabled="!canRedo"
                @click="load(history.redo)"
              >
                Redo
              </button>
            </div>
            <p class="mt-3 h-8 overflow-auto text-xs text-muted" role="status">{{ notice }}</p>
          </form>
        </section>
        <section
          data-ui="story-reader"
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="reader-heading"
        >
          <div class="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h2 id="reader-heading" class="text-lg font-semibold">Read the kept version</h2>
            <span class="text-xs text-muted">SAVED SNAPSHOT</span>
          </div>
          <div
            class="h-[645px] overflow-y-auto rounded-xl border border-line bg-background p-5 sm:p-7"
            tabindex="0"
            role="region"
            aria-label="Saved story preview"
          >
            <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              A SMALL ORIGINAL STORY
            </p>
            <h3 class="mt-4 break-words text-2xl font-semibold leading-tight sm:text-3xl">
              {{ current.name }}
            </h3>
            <p class="mt-4 break-words text-sm italic leading-relaxed text-muted">
              {{ current.subtitle }}
            </p>
            <div class="mt-7 space-y-6">
              <p
                v-for="(paragraph, index) in paragraphs(current.body)"
                :key="index"
                class="break-words text-sm leading-loose text-ink"
              >
                {{ paragraph }}
              </p>
              <p v-if="!current.body.trim()" class="text-sm leading-relaxed text-muted">
                The page is ready for its first sentence.
              </p>
            </div>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-muted">
            This preview and exports follow the current kept snapshot. Save to include your pending
            edits.
          </p>
        </section>
        <aside
          data-ui="snapshot-history"
          class="min-w-0 rounded-2xl border border-line bg-surface p-5"
          aria-labelledby="history-heading"
        >
          <h2 id="history-heading" class="mb-5 text-lg font-semibold">A trail of drafts</h2>
          <p class="mb-4 text-xs leading-relaxed text-muted">
            {{ entries.length }} of 30 snapshots · Session history
          </p>
          <div
            class="h-[530px] overflow-y-auto rounded-xl border border-line p-2"
            role="region"
            tabindex="0"
            aria-label="Snapshot history"
          >
            <button
              v-for="entry in entries"
              :key="entry.index"
              :data-snapshot="entry.index"
              class="mb-2 block! w-full min-w-0 text-left hover:bg-soft"
              :class="entry.current ? 'border-accent! bg-soft' : 'border-transparent!'"
              :aria-pressed="entry.current"
              :aria-label="`Load snapshot ${entry.index + 1}: ${entry.label}`"
              @click="load(() => history.jump(entry.index))"
            >
              <span class="block text-[10px] font-normal uppercase tracking-wider text-accent"
                >VERSION {{ entry.index + 1 }}{{ entry.current ? ' · CURRENT' : '' }}</span
              ><span class="mt-2 block truncate text-xs font-semibold">{{ entry.label }}</span
              ><span class="mt-2 block text-[10px] font-normal text-muted"
                >{{ entry.characters }} characters</span
              >
            </button>
          </div>
          <div class="mt-5 rounded-xl bg-soft p-4">
            <p class="font-display text-lg">A new direction.</p>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              Saving after Undo replaces the later branch. The latest 30 snapshots stay available
              until reload.
            </p>
          </div>
        </aside>
      </div>
      <footer class="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span>Short prose, kept deliberately · SD/1</span><span>{{ marker }} · CodeSculptor</span>
      </footer>
    </main>
    <AppDialog v-model="confirm" title="Discard pending edits?"
      ><p class="leading-relaxed text-muted">
        Loading a snapshot replaces the unsaved editor fields. Cancel and save them first if you
        want to keep this version.
      </p>
      <div class="mt-6 flex justify-end gap-2">
        <button @click="confirm = false">Cancel</button
        ><button class="bg-accent text-on-accent" @click="accept">Load snapshot</button>
      </div></AppDialog
    >
  </div>
</template>
