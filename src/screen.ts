import { defineScreen } from '@mission-control/plugin-sdk/screen'
import type { ScreenApi } from '@mission-control/plugin-sdk'
import '@mission-control/plugin-sdk/ui.css'
import type { HelloBoard, HelloCard } from './server'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function reportFailure(mc: ScreenApi, text: string): Promise<void> {
  try {
    await mc.ui.toast(text, 'error')
  } catch {
    // toast is this frame's only output channel; if it is gone the screen is already dead
  }
}

async function startChat(mc: ScreenApi, card: HelloCard): Promise<void> {
  try {
    const cwd = (await mc.folders.recent())[0] ?? '~'
    await mc.sessions.startChat({
      title: card.title,
      cwd,
      context: { name: `hello-${card.id}`, markdown: `# ${card.title}` },
    })
  } catch (error) {
    await reportFailure(mc, `Couldn't start the chat for "${card.title}": ${errorMessage(error)}`)
  }
}

function cardNode(mc: ScreenApi, card: HelloCard): HTMLElement {
  const start = document.createElement('button')
  start.type = 'button'
  start.className = 'connection-button primary'
  start.textContent = 'Start chat'
  start.addEventListener('click', () => void startChat(mc, card))

  const acts = document.createElement('div')
  acts.className = 'mk-acts'
  acts.append(start)

  const title = document.createElement('strong')
  title.textContent = card.title

  const cardElement = document.createElement('article')
  cardElement.className = 'mk-card'
  cardElement.tabIndex = 0
  cardElement.append(title, acts)
  return cardElement
}

function columnNode(mc: ScreenApi, board: HelloBoard): HTMLElement {
  const count = document.createElement('em')
  count.textContent = String(board.cards.length)

  const header = document.createElement('header')
  header.append(document.createElement('i'), 'Hello', count)

  const column = document.createElement('section')
  column.className = 'mk-col'
  column.style.setProperty('--st', 'var(--accent)')
  column.append(header, ...board.cards.map((card) => cardNode(mc, card)))
  return column
}

function errorNode(error: unknown, onRetry: () => void): HTMLElement {
  const detail = document.createElement('p')
  detail.className = 'muted'
  detail.textContent = errorMessage(error)

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'pill'
  retry.textContent = 'Try again'
  retry.addEventListener('click', onRetry)

  const heading = document.createElement('h2')
  heading.textContent = "Couldn't load the board"

  const empty = document.createElement('div')
  empty.className = 'mk-empty'
  empty.append(heading, detail, retry)
  return empty
}

async function paint(root: HTMLElement, mc: ScreenApi): Promise<void> {
  let board: HelloBoard
  try {
    board = (await mc.call('hello.cards')) as HelloBoard
  } catch (error) {
    root.replaceChildren(errorNode(error, () => void paint(root, mc)))
    return
  }
  const greeting = document.createElement('h2')
  greeting.textContent = board.greeting
  const columns = document.createElement('div')
  columns.className = 'mk-cols'
  columns.append(columnNode(mc, board))
  root.replaceChildren(greeting, columns)
}

export default defineScreen(paint)
