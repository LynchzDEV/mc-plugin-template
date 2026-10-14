import { definePlugin } from '@shikidan/plugin-sdk/server'

export type HelloCard = { id: string; title: string }

export type HelloBoard = { greeting: string; cards: HelloCard[] }

const CARDS: HelloCard[] = [
  { id: '1', title: 'Read the plugin guide' },
  { id: '2', title: 'Change this board' },
  { id: '3', title: 'Ship your own plugin' },
]

const DEFAULT_GREETING = 'Hello'

export default definePlugin({
  methods: {
    'hello.cards': async (_params: undefined, ctx): Promise<HelloBoard> => ({
      greeting: (await ctx.settings.get('greeting')) ?? DEFAULT_GREETING,
      cards: CARDS,
    }),
  },
})
