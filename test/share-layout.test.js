const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateShareLayout,
  mapDocumentBounds,
  unmapShareBounds,
} = require("../share-layout.js");

test("square share canvas grows around landscape content without scaling it down", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1600,
    requestedHeight: 1600,
    contentWidth: 1920,
    contentHeight: 1080,
    paddingPercent: 10,
    fixImageBlur: true,
  });

  assert.deepEqual(layout.dimensions, { width: 2400, height: 2400 });
  assert.equal(layout.content.scale, 1);
  assert.deepEqual(layout.content, {
    x: 240,
    y: 660,
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
    fixImageBlur: true,
  });

  assert.deepEqual(layout.dimensions, { width: 1280, height: 720 });
  assert.deepEqual(layout.content, { x: 0, y: 0, width: 1280, height: 720, scale: 1 });
});

test("portrait preset keeps its aspect while preserving landscape source pixels", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1080,
    requestedHeight: 1350,
    contentWidth: 1920,
    contentHeight: 1080,
    paddingPercent: 10,
    fixImageBlur: true,
  });

  assert.deepEqual(layout.dimensions, { width: 2400, height: 3000 });
  assert.equal(layout.dimensions.width / layout.dimensions.height, 4 / 5);
  assert.equal(layout.content.scale, 1);
});

test("story preset stays within one pixel of its selected aspect", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1080,
    requestedHeight: 1920,
    contentWidth: 1920,
    contentHeight: 1080,
    paddingPercent: 10,
    fixImageBlur: true,
  });

  assert.deepEqual(layout.dimensions, { width: 2400, height: 4267 });
  assert.ok(Math.abs(layout.dimensions.width / layout.dimensions.height - 9 / 16) < 0.0001);
  assert.equal(layout.content.scale, 1);
});

test("blur fix does not upscale an image that already fits the selected canvas", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1600,
    requestedHeight: 1600,
    contentWidth: 800,
    contentHeight: 600,
    paddingPercent: 10,
    fixImageBlur: true,
  });

  assert.deepEqual(layout.dimensions, { width: 1600, height: 1600 });
  assert.equal(layout.content.scale, 1);
  assert.deepEqual(
    { width: layout.content.width, height: layout.content.height },
    { width: 800, height: 600 },
  );
});

test("reflection expands the selected canvas shape instead of shrinking the edit surface", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1000,
    requestedHeight: 500,
    contentWidth: 1000,
    contentHeight: 500,
    paddingPercent: 10,
    reflection: true,
    fixImageBlur: true,
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
    fixImageBlur: false,
  });

  assert.deepEqual(layout.dimensions, { width: 1600, height: 1600 });
  assert.equal(layout.content.scale, 1280 / 2400);
});

test("horizontal and vertical percentage padding are applied independently", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1000,
    requestedHeight: 1000,
    contentWidth: 800,
    contentHeight: 600,
    paddingX: 10,
    paddingY: 20,
    paddingUnit: "percent",
    fixImageBlur: false,
  });

  assert.deepEqual(layout.dimensions, { width: 1000, height: 1000 });
  assert.deepEqual(layout.padding, { unit: "percent", x: 10, y: 20 });
  assert.deepEqual(layout.content, { x: 100, y: 200, width: 800, height: 600, scale: 1 });
});

test("pixel padding creates exact per-side room when source pixels are preserved", () => {
  const layout = calculateShareLayout({
    requestedWidth: 1000,
    requestedHeight: 800,
    contentWidth: 970,
    contentHeight: 730,
    paddingX: 15,
    paddingY: 35,
    paddingUnit: "pixels",
    fixImageBlur: true,
  });

  assert.deepEqual(layout.dimensions, { width: 1000, height: 800 });
  assert.deepEqual(layout.padding, { unit: "pixels", x: 15, y: 35 });
  assert.deepEqual(layout.content, { x: 15, y: 35, width: 970, height: 730, scale: 1 });
});

test("document and share bounds use an invertible shared transform", () => {
  const transform = { x: 240, y: 135, scale: 1 };
  const redaction = { x: 410, y: 220, width: 300, height: 84 };
  const mapped = mapDocumentBounds(redaction, transform);

  assert.deepEqual(mapped, { x: 650, y: 355, width: 300, height: 84 });
  assert.deepEqual(unmapShareBounds(mapped, transform), redaction);
});
