import { afterAll, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import type { ScreenApi, SessionRequest } from '@shikidan/plugin-sdk'
import type { HelloBoard } from '../src/server'

const window = new Window()
globalThis.document = window.document as unknown as Document

const screenDefinition = await import('../src/screen')

const BOARD: HelloBoard = {
  greeting: 'Welcome aboard',
  cards: [
    { id: '1', title: 'Read the plugin guide' },
    { id: '2', title: 'Change this board' },
    { id: '3', title: 'Ship your own plugin' },
  ],
}

const CLICK_CHAIN_MICROTASK_HOPS = 20

async function settleActions(): Promise<void> {
  for (let hop = 0; hop < CLICK_CHAIN_MICROTASK_HOPS; hop += 1) await Promise.resolve()
}

type HarnessOptions = {
  recentFolders?: string[]
  recentError?: Error
  startChatError?: Error
}

function screenHarness(options: HarnessOptions = {}): {
  mc: ScreenApi
  toasts: Array<{ text: string; kind?: string }>
  requests: SessionRequest[]
} {
  const toasts: Array<{ text: string; kind?: string }> = []
  const requests: SessionRequest[] = []
  const mc: ScreenApi = {
    call: async () => BOARD,
    sessions: {
      startChat: async (req) => {
        requests.push(req)
        if (options.startChatError) throw options.startChatError
      },
      startTerminal: async () => {},
    },
    settings: { view: async () => ({ values: {}, configured: {} }), set: async () => {} },
    folders: {
      recent: async () => {
        if (options.recentError) throw options.recentError
        return options.recentFolders ?? ['/repos/shiki']
      },
    },
    ui: {
      toast: async (text: string, kind?: 'info' | 'error') => {
        toasts.push({ text, kind })
      },
    },
    theme: async () => 'light',
    onTheme: async () => {},
  }
  return { mc, toasts, requests }
}

async function mountedBoard(options?: HarnessOptions): Promise<{
  root: HTMLElement
  harness: ReturnType<typeof screenHarness>
}> {
  const harness = screenHarness(options)
  const root = document.createElement('div')
  await screenDefinition.default.mount(root, harness.mc)
  return { root, harness }
}

function startChatButton(card: Element): HTMLButtonElement {
  const button = card.querySelector('.mk-acts button')
  if (!button) throw new Error('card has no start button')
  return button as HTMLButtonElement
}

async function clickStartChat(card: Element): Promise<void> {
  startChatButton(card).click()
  await settleActions()
}

afterAll(() => {
  window.close()
  delete (globalThis as { document?: Document }).document
})

describe('hello board screen', () => {
  test('renders the greeting and the three cards', async () => {
    const { root } = await mountedBoard()
    expect(root.querySelector('h2')?.textContent).toBe('Welcome aboard')
    const titles = [...root.querySelectorAll('.mk-card strong')].map((node) => node.textContent)
    expect(titles).toEqual(['Read the plugin guide', 'Change this board', 'Ship your own plugin'])
  })

  test('keeps every card keyboard-focusable so its actions can be revealed', async () => {
    const { root } = await mountedBoard()
    const cards = [...root.querySelectorAll('.mk-card')]
    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect(card.getAttribute('tabindex')).toBe('0')
      expect(card.querySelector('.mk-acts button')?.textContent).toBe('Start chat')
    }
  })

  test('starts a chat with the recent folder and the card context', async () => {
    const { root, harness } = await mountedBoard()
    await clickStartChat(root.querySelectorAll('.mk-card')[0])
    expect(harness.requests).toEqual([
      {
        title: 'Read the plugin guide',
        cwd: '/repos/shiki',
        context: { name: 'hello-1', markdown: '# Read the plugin guide' },
      },
    ])
    expect(harness.toasts).toEqual([])
  })

  test('falls back to the home folder when no recent folder exists', async () => {
    const { root, harness } = await mountedBoard({ recentFolders: [] })
    await clickStartChat(root.querySelectorAll('.mk-card')[1])
    expect(harness.requests[0]?.cwd).toBe('~')
  })

  test('shows an error toast when the chat cannot start', async () => {
    const { root, harness } = await mountedBoard({
      startChatError: new Error('session queue is down'),
    })
    await clickStartChat(root.querySelectorAll('.mk-card')[2])
    expect(harness.toasts).toHaveLength(1)
    expect(harness.toasts[0]?.kind).toBe('error')
    expect(harness.toasts[0]?.text).toContain('Ship your own plugin')
    expect(harness.toasts[0]?.text).toContain('session queue is down')
  })

  test('shows an error toast when the folder lookup fails', async () => {
    const { root, harness } = await mountedBoard({
      recentError: new Error('folder history unavailable'),
    })
    await clickStartChat(root.querySelectorAll('.mk-card')[0])
    expect(harness.requests).toEqual([])
    expect(harness.toasts).toHaveLength(1)
    expect(harness.toasts[0]?.kind).toBe('error')
    expect(harness.toasts[0]?.text).toContain('folder history unavailable')
  })
})
