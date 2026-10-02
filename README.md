# Visual DJ

> Create visuals that move with your sound.

Visual DJ is a web studio for DJs and live artists to design custom visuals for
their shows, with no design, video or coding skills needed. Pick a template,
add your artist name and logo, tweak colours, fonts and motion, organise your
set into scenes, and perform it fullscreen in **Show Mode**.

This first version runs entirely in the browser: there is no backend, login or
payments yet. Projects are saved in `localStorage` and uploaded media in
IndexedDB.

## What you can do

- **Landing** (`/`): product story, live previews, popular templates.
- **Dashboard** (`/dashboard`): greeting, continue where you left off, recent
  visuals, recommended templates, genres, quick access to Show Mode. Includes
  an empty state and a "load demo shows" option.
- **Template library** (`/templates`): 30 templates across 10 genres, with
  search and filters (genre, style, energy, colour, animation), live animated
  thumbnails and a full preview of each template's five-scene show set.
- **Editor** (`/editor/:id`):
  - Element sidebar: Text, Artist Name, Logo (upload, initials monogram or
    built-in marks), Image, Video, Shapes, Backgrounds, Effects, Overlays,
    Particles, Audio Reactive and Templates.
  - 16:9 "LED screen" canvas with live preview, click to select, drag to move,
    corner handles to resize, rotate handle, centre snapping and drag-and-drop
    uploads.
  - Playback bar: play/pause, restart, bar/beat timeline with scrubbing, BPM
    with tap tempo, loop length, zoom and fullscreen preview.
  - Properties panel generated from per-layer schemas, with collapsible
    Basic / Position / Animation / Effects / Advanced sections.
  - Layers: select, rename, hide, lock, reorder (drag and drop or menu).
  - Scenes: add, duplicate, rename, delete, reorder, switch with keys 1–9.
  - Project palette: change one colour and every layer using it updates.
  - Undo/redo, autosave with a "Saving… / Saved" indicator.
  - Interactive onboarding tour on first visit (restartable from Settings or
    the Help menu).
- **Audio reactive** (experimental): Bass Pulse, Beat Flash, Waveform,
  Frequency Bars, Particle Burst, Strobe and Camera Shake. They react to a
  built-in demo beat at the project BPM, to a local audio file, or to live input
  (microphone / mixer line-in) through the Web Audio API.
- **Show Mode** (`/show/:id`): fullscreen output, auto-hiding controller,
  scene pads, keyboard control (1–9, ←/→), cut / crossfade / flash
  transitions, blackout, hold-to-strobe, freeze, tap tempo, wake lock and a
  double-Esc safety before leaving.
- **Export**: PNG stills and seamless WebM loops of the current scene work
  today. MP4 and GIF are marked "Coming soon".
- **Settings** (`/settings`): interface, performance (render quality, fps
  cap, animated thumbnails), default export resolution, Show Mode controls
  (transition, auto-hide, reduce flashing), keyboard shortcuts, restart
  tutorial and local data management.

On phones the editor shows a simplified screen that links to Show Mode; tablets
can choose to continue to the editor. The landing page is fully responsive.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run lint
npm run typecheck
npm run build && npm start
```

Deploying on Vercel needs no configuration: import the repository and deploy.

## Tech stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS 3, Framer Motion, Lucide icons
- Zustand for state
- A custom Canvas 2D render engine (no WebGL dependency)
- Fonts self-hosted with `next/font`

## Architecture

```
src/
  app/                 Routes: landing, (app)/dashboard|templates|settings,
                       editor/[projectId], show/[projectId], new
  config/brand.ts      Product name, wordmark and storage namespace (rename here)
  domain/              Pure, serialisable model: types, factories, catalog
                       (effect/overlay metadata), templates → show sets,
                       project operations, schema migrations
  engine/              Rendering, independent of React:
    render/            renderScene() + one renderer per layer kind
    audio.ts           Simulated beat + Web Audio analysis
    clock.ts           Playback clock shared by the stage and thumbnails
    ticker.ts          Single requestAnimationFrame loop for every canvas
    assets.ts          Media references → drawable elements
  data/                Mock content: templates, genres, palettes, presets,
                       shortcuts
  services/            Persistence boundaries (swap these for a backend):
    projects/          ProjectRepository (localStorage implementation)
    media/             MediaStore (IndexedDB implementation)
    export/            PNG / WebM exporters
  store/               Zustand stores: projects (autosave), editor (selection,
                       history), settings, toasts
  components/          UI split by area: editor/{sidebar,canvas,properties,
                       layers,scenes}, show/, tutorial/, templates/,
                       dashboard/, landing/, app-shell/, ui/ (design system)
```

### How rendering works

Each scene is a list of layers rendered bottom to top on a logical 1920×1080
stage, then scaled to any canvas size (thumbnail, editor, 4K export). Frames
are a pure function of time, so scrubbing, exports and Show Mode all match the
preview. Animation speeds are quantised so every animation completes a whole
number of cycles per loop: scenes loop seamlessly over their bar length at the
project BPM.

### Ready for what comes next

The code is organised so the planned features slot in without rewrites:

| Future feature | Where it plugs in |
| --- | --- |
| Google login, DJ profiles | `Project.ownerId` is reserved; add an auth provider in `app/providers.tsx` and an Account section in Settings |
| Cloud storage & sync across devices | Implement `ProjectRepository` and `MediaStore` against an API; both interfaces are already async |
| Payments, subscriptions, premium library | Templates carry a `tier: "free" \| "pro"` field |
| Template marketplace | Templates are data (`TemplateDefinition`) with author metadata |
| Collaboration | Every edit goes through `store/editorActions.ts`, a single place to emit change events |
| MIDI, Ableton Link, Rekordbox | Show Mode actions (`goTo`, blackout, strobe, tap) are plain functions ready to bind to MIDI or a sync clock; `PlaybackClock.alignBeat` handles beat alignment |
| Resolume / NDI output | `renderScene()` renders to any canvas, offscreen included |
| AI-generated visuals | Generate `Layer[]` (plain JSON) and pass it to `editorActions.replaceSceneLayers` |
| MP4 / GIF export | Add exporters next to `services/export/exporters.ts` |

Schema changes go through `domain/migrations.ts` (bump
`PROJECT_SCHEMA_VERSION`).

## Accessibility & safety

Strobe and flash effects carry a photosensitivity notice, and Settings →
Show controls → **Reduce flashing** caps their brightness and rate. Interface
motion can be reduced independently from the visuals.
