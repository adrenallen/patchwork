# Patchwork

![Patchwork logo](assets/patchwork-logo.png)

Patchwork is a fast, local image redaction and screenshot-markup tool. Paste, drop, or open images; arrange them in layers; then mask, blur, crop, label, and annotate without uploading anything.

## Preview

![Patchwork editor showing replacement text, patterned redactions, and a gradient share canvas](assets/patchwork-editor-preview.png)

## Features

- Paste, drag/drop, or upload one or multiple PNG, JPG, WebP, and GIF images
- One-click New canvas action that saves the current document to Recent Images before resetting the workspace
- Selectable image layers that can be moved, resized, reordered, and removed
- A separate Share canvas background that keeps image layers and edits together on the original editable surface
- Per-screenshot solid or gradient edge lighting with adjustable outline width and glow strength
- Free-standing canvas text layers with solid or gradient color, multiline headlines, four font families, styling, move, resize, and rotation controls
- Solid, diagonal, and crosshatch fills
- Editable Gaussian and pixelized blur masks with adjustable strength
- Replacement text with custom background, text color, font size, style, and remembered Sans, Serif, Mono, or handwritten font choices
- Per-tool remembered settings, so masks, text, blur, and marker tools keep independent styles
- Selectable masks, blur areas, text, circles, arrows, and lines that can be moved or resized after placement
- Browser-local Smart Text OCR for finding repeated words or phrases, previewing changes, and bulk removing, blurring, masking, or replacing selected matches
- Smart Text replacement typography detection with auto-expanding text boxes, near-zero sizing, global defaults, and per-match weight, size, and rotation overrides
- Every Smart Text replacement remains an editable text layer with direct move, resize, and rotation handles plus Shift-click multi-selection for shared styling
- Tools apply as soon as you release the pointer
- Clean or genuinely irregular hand-drawn marker circles, arrows, and lines with remembered color, stroke size, adjustable roughness, and open-ended rough circles
- Bendable arrows and lines with a simple middle curve handle
- Dedicated drag-to-crop mode with dimension-safe undo and redo
- Non-destructive workspace zoom, Fit, and drag-to-pan controls
- Ten recent tool presets, with reused settings promoted to the top
- Optional gradient or transparent presentation canvas with six curated backgrounds and one export-ready reflection of the combined visible image layout
- Image, square, portrait, landscape, and story canvas shapes that add background without resizing the edited image
- Left, center, and right image positioning for opening a clean headline column on editorial layouts
- One Image → Export size readout with independent horizontal and vertical padding in precise percentage or pixel units
- Original-resolution exports, rounded editable-image corners, and transparent corners when no background area is added
- Undo, redo, keyboard controls, clipboard copy, and PNG export
- Preferences, recent presets, layered documents, and editable image history saved locally in the browser
- No uploads or server-side image processing

Smart Text loads Tesseract.js and its English recognition model from jsDelivr on first use, then performs recognition locally in the browser. Image pixels are not sent to an OCR service.

## Use

Download the files and open `index.html` in a browser. The editor has no build step; Smart Text needs an internet connection the first time its OCR engine and English model are cached.
