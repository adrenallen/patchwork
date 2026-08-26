# Patchwork

Patchwork is a fast, local image redaction tool for screenshots. Paste, drop, or open an image; drag a box; then cover it with a solid or patterned mask, or replace it with styled placeholder text.

## Features

- Paste, drag/drop, or upload PNG, JPG, WebP, and GIF images
- Solid, diagonal, and crosshatch fills
- Replacement text with custom background, text color, and font size
- Recent patch presets for quickly reusing names and styles
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
