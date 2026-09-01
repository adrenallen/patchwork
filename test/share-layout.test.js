const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateShareLayout,
  mapDocumentBounds,
  unmapShareBounds,
} = require("../share-layout.js");

test("image shape with zero padding preserves the editable image dimensions", () => {
  const layout = calculateShareLayout({
    contentWidth: 1280,
    contentHeight: 720,
    paddingX: 0,
    paddingY: 0,
    paddingUnit: "pixels",
  });

  assert.deepEqual(layout.dimensions, { width: 1280, height: 720 });
  assert.deepEqual(layout.content, { x: 0, y: 0, width: 1280, height: 720, scale: 1 });
});

test("image shape adds exact independent pixel padding", () => {
  const layout = calculateShareLayout({
    contentWidth: 970,
    contentHeight: 730,
    paddingX: 15,
    paddingY: 35,
    paddingUnit: "pixels",
  });

  assert.deepEqual(layout.dimensions, { width: 1000, height: 800 });
  assert.deepEqual(layout.padding, {
    unit: "pixels",
    x: 15,
    y: 35,
    pixelsX: 15,
    pixelsY: 35,
  });
  assert.deepEqual(layout.content, { x: 15, y: 35, width: 970, height: 730, scale: 1 });
});

test("percentage padding is measured from the image width and height", () => {
  const layout = calculateShareLayout({
    contentWidth: 800,
    contentHeight: 600,
    paddingX: 10,
    paddingY: 20,
    paddingUnit: "percent",
  });

  assert.deepEqual(layout.dimensions, { width: 960, height: 840 });
  assert.deepEqual(layout.padding, {
    unit: "percent",
    x: 10,
    y: 20,
    pixelsX: 80,
    pixelsY: 120,
  });
  assert.deepEqual(layout.content, { x: 80, y: 120, width: 800, height: 600, scale: 1 });
});

test("square shape expands background around landscape content without scaling it", () => {
  const layout = calculateShareLayout({
    contentWidth: 1920,
    contentHeight: 1080,
    paddingX: 10,
    paddingY: 10,
    paddingUnit: "percent",
    aspectRatio: 1,
  });

  assert.deepEqual(layout.dimensions, { width: 2304, height: 2304 });
  assert.deepEqual(layout.content, { x: 192, y: 612, width: 1920, height: 1080, scale: 1 });
});

test("shape padding is a minimum and the chosen ratio may add more on one axis", () => {
  const layout = calculateShareLayout({
    contentWidth: 800,
    contentHeight: 600,
    paddingX: 10,
    paddingY: 20,
    paddingUnit: "pixels",
    aspectRatio: 1,
  });

  assert.deepEqual(layout.dimensions, { width: 820, height: 820 });
  assert.deepEqual(layout.content, { x: 10, y: 110, width: 800, height: 600, scale: 1 });
});

test("portrait and story shapes preserve their selected aspect ratios", () => {
  const portrait = calculateShareLayout({
    contentWidth: 1920,
    contentHeight: 1080,
    paddingX: 10,
    paddingY: 10,
    paddingUnit: "percent",
    aspectRatio: 4 / 5,
  });
  const story = calculateShareLayout({
    contentWidth: 1920,
    contentHeight: 1080,
    paddingX: 10,
    paddingY: 10,
    paddingUnit: "percent",
    aspectRatio: 9 / 16,
  });

  assert.deepEqual(portrait.dimensions, { width: 2304, height: 2880 });
  assert.deepEqual(story.dimensions, { width: 2304, height: 4096 });
  assert.equal(portrait.content.scale, 1);
  assert.equal(story.content.scale, 1);
});

test("landscape shape adds horizontal background around portrait content", () => {
  const layout = calculateShareLayout({
    contentWidth: 800,
    contentHeight: 1000,
    paddingX: 0,
    paddingY: 0,
    paddingUnit: "pixels",
    aspectRatio: 16 / 9,
  });

  assert.deepEqual(layout.dimensions, { width: 1778, height: 1000 });
  assert.deepEqual(layout.content, { x: 489, y: 0, width: 800, height: 1000, scale: 1 });
});

test("reflection participates in the canvas shape without shrinking the image", () => {
  const layout = calculateShareLayout({
    contentWidth: 1000,
    contentHeight: 500,
    paddingX: 0,
    paddingY: 0,
    paddingUnit: "pixels",
    aspectRatio: 2,
    reflection: true,
  });

  assert.deepEqual(layout.dimensions, { width: 1238, height: 619 });
  assert.deepEqual(layout.content, { x: 119, y: 0, width: 1000, height: 500, scale: 1 });
  assert.deepEqual(layout.reflection, { height: 110, gap: 9 });
});

test("browser canvas limits scale the whole composition only when necessary", () => {
  const layout = calculateShareLayout({
    contentWidth: 12000,
    contentHeight: 12000,
    paddingX: 1000,
    paddingY: 1000,
    paddingUnit: "pixels",
  });

  assert.equal(layout.constrained, true);
  assert.ok(layout.content.scale < 1);
  assert.ok(layout.dimensions.width <= 12000);
  assert.ok(layout.dimensions.height <= 12000);
  assert.ok(layout.dimensions.width * layout.dimensions.height <= 48_000_000);
});

test("document and share bounds use an invertible shared transform", () => {
  const transform = { x: 240, y: 135, scale: 1 };
  const redaction = { x: 410, y: 220, width: 300, height: 84 };
  const mapped = mapDocumentBounds(redaction, transform);

  assert.deepEqual(mapped, { x: 650, y: 355, width: 300, height: 84 });
  assert.deepEqual(unmapShareBounds(mapped, transform), redaction);
});
