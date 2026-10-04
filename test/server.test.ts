import { describe, expect, test } from 'bun:test'
import type { ServerContext } from '@mission-control/plugin-sdk'
import plugin from '../src/server'

function fakeCtx(greeting: string | null): ServerContext {
  return {
    settings: { get: async () => greeting, set: async () => {} },
    data: '/tmp/hello-board-files',
    log: () => {},
  }
}

describe('hello.cards', () => {
  test('returns the three cards with the saved greeting', async () => {
    const board = await plugin.methods['hello.cards'](undefined, fakeCtx('Welcome aboard'))
    expect(board).toEqual({
      greeting: 'Welcome aboard',
      cards: [
        { id: '1', title: 'Read the plugin guide' },
        { id: '2', title: 'Change this board' },
        { id: '3', title: 'Ship your own plugin' },
      ],
    })
  })

  test('falls back to the default greeting when none is saved', async () => {
    const board = await plugin.methods['hello.cards'](undefined, fakeCtx(null))
    expect(board.greeting).toBe('Hello')
  })
})
