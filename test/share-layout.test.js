const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateShareLayout,
  mapDocumentBounds,
  unmapShareBounds,
} = require("../share-layout.js");

test("source-ratio share canvas grows around content without scaling it down", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1920,
    requestedHeight: 1080,
    contentWidth: 1920,
    contentHeight: 1080,
    paddingPercent: 10,
    preserveContentScale: true,
  });

  assert.deepEqual(layout.dimensions, { width: 2400, height: 1350 });
  assert.equal(layout.content.scale, 1);
  assert.deepEqual(layout.content, {
    x: 240,
    y: 135,
    width: 1920,
    height: 1080,
    scale: 1,
  });
});

test("zero padding keeps source pixels at their original dimensions", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1280,
    requestedHeight: 720,
    contentWidth: 1280,
    contentHeight: 720,
    paddingPercent: 0,
    preserveContentScale: true,
  });

  assert.deepEqual(layout.dimensions, { width: 1280, height: 720 });
  assert.deepEqual(layout.content, { x: 0, y: 0, width: 1280, height: 720, scale: 1 });
});

test("reflection expands a source-ratio canvas instead of shrinking the edit surface", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1000,
    requestedHeight: 500,
    contentWidth: 1000,
    contentHeight: 500,
    paddingPercent: 10,
    reflection: true,
    preserveContentScale: true,
  });

  assert.equal(layout.content.scale, 1);
  assert.equal(layout.content.width, 1000);
  assert.equal(layout.content.height, 500);
  assert.ok(layout.dimensions.width > 1250);
  assert.ok(layout.dimensions.height > 625);
});

test("fixed presets retain their requested output dimensions", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1600,
    requestedHeight: 1600,
    contentWidth: 2400,
    contentHeight: 1200,
    paddingPercent: 10,
    preserveContentScale: false,
  });

  assert.deepEqual(layout.dimensions, { width: 1600, height: 1600 });
  assert.equal(layout.content.scale, 1280 / 2400);
});

test("document and share bounds use an invertible shared transform", () => {
  const transform = { x: 240, y: 135, scale: 1 };
  const redaction = { x: 410, y: 220, width: 300, height: 84 };
  const mapped = mapDocumentBounds(redaction, transform);

  assert.deepEqual(mapped, { x: 650, y: 355, width: 300, height: 84 });
  assert.deepEqual(unmapShareBounds(mapped, transform), redaction);
});
