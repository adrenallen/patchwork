# Patchwork

Current release: **v1.0.0**

Patchwork is a fast, local image redaction tool for screenshots. Paste, drop, or open an image; drag a box; then cover it with a solid or patterned mask, or replace it with styled placeholder text.

## Preview

![Patchwork editor showing replacement text, patterned redactions, and a gradient share canvas](assets/patchwork-editor-preview.png)

## Features

- Paste, drag/drop, or upload PNG, JPG, WebP, and GIF images
- Solid, diagonal, and crosshatch fills
- Replacement text with custom background, text color, and font size
- Recent patch presets for quickly reusing names and styles
- Optional gradient presentation canvas with six curated backgrounds
- Square, portrait, landscape, and story presets plus custom pixel dimensions
- Source-size output and optional image-ratio locking for edge-to-edge framing
- Adjustable presentation padding, rounded image corners, and export shadow
- Undo, redo, keyboard controls, and PNG export
- Preferences and recent presets saved locally in the browser
- No uploads or server-side image processing

## Run locally

There is no build step or dependency installation.

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

You can also open `index.html` directly in a modern browser.
