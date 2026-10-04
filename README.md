# Hello board — Mission Control plugin template

Copy this repo to start a [Mission Control](https://github.com/LynchzDEV/mission-control) plugin.
It is a complete, working plugin — one setting, three cards, a Start chat button — small enough
to read in one sitting.

## What's inside

| File | What it is |
|---|---|
| `mc-plugin.json` | The manifest: id, permissions, settings. The host reads this first. |
| `src/server.ts` | The server part: one method the screen can call, with the plugin's own `ctx`. |
| `src/screen.ts` | The screen part: renders the board, starts chats through `mc`. |
| `test/server.test.ts` | Calls the server method directly with a fake `ctx`. Run with `bun test`. |
| `test/screen.test.ts` | Mounts the screen in a DOM (`happy-dom`) and clicks through: focus, Start chat, error toasts. |

## Start a plugin from here

1. Copy the repo: **Use this template** on GitHub, or clone it and push to a repo of your own.
2. Give it an identity: change `id`, `name`, `version` and `description` in `mc-plugin.json`.
   Ids are lowercase letters, digits and dashes, 3–40 characters.
3. Declare what it needs in `permissions` — every entry shows in the install prompt. This
   template asks to start chats and keep one setting; nothing else.
4. Write the server part in `src/server.ts`: one method per thing the screen can call.
5. Write the screen part in `src/screen.ts`: render, then act through `mc`.
6. `bun install && bun test` until green.
7. Try it live: Mission Control → **Marketplace** → *Install from a link*, with
   `file:///absolute/path/to/your-checkout` (fastest loop) or your git URL and ref.
8. Ship: push, tag a release (`v0.1.0`), list it in a marketplace's `marketplace.json`.

The full API — both runtimes, `mc`, `ctx`, every manifest rule — is the
[SDK README](https://github.com/LynchzDEV/mc-plugin-sdk#readme).

## The one flow worth reading

`Start chat` on a card calls `mc.sessions.startChat` with the card title, the most recent
folder as the working directory, and a small task context (`# <card title>`). Mission Control
opens its launcher pre-filled; the user confirms; the session starts with the context attached.
That hand-off — screen → `mc` → host launcher — is the pattern every plugin screen uses.

## Trusted or isolated?

This template is `trusted`, so it runs inside Mission Control with full access — right for a
demo you own, wrong for a stranger's plugin. Default your own plugins to `isolated`: the OS
sandbox limits files and network to exactly what the manifest declares. Only the manifest line
changes; the code stays the same.
