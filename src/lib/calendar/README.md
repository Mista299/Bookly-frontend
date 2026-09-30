# Vendored copy of @event-calendar/core

We vendor the dist build of [`@event-calendar/core`](https://www.npmjs.com/package/@event-calendar/core) here because the package's `exports` field maps the bare specifier to `src/index.svelte.js`, which is a Svelte-component bundle that **does not export** `createCalendar` / `destroyCalendar` — only the Svelte `Calendar` component and the plugin singletons. The imperative API we need lives in `dist/index.js`.

Instead of forking or patching upstream, we copy the dist files locally and import them through a relative path. Vite, esbuild and SSR all handle plain relative `.js` imports cleanly without consulting the package.json `exports` map.

## Files
- `ec.js` — copy of `node_modules/@event-calendar/core/dist/index.js`
- `ec.css` — copy of `node_modules/@event-calendar/core/dist/index.css`

## Updating
```bash
cp node_modules/@event-calendar/core/dist/index.js  src/lib/calendar/ec.js
cp node_modules/@event-calendar/core/dist/index.css src/lib/calendar/ec.css
```
