const test = require("node:test");
const assert = require("node:assert/strict");
const {
  extractOcrWords,
  findPhraseMatches,
  estimatePatchAppearance,
  inferFontFamily,
  inferFontWeight,
  paddedBounds,
} = require("../smart-text.js");

test("extracts word geometry from Tesseract block output in reading order", () => {
  const words = extractOcrWords({
    blocks: [{ paragraphs: [{ lines: [
      {
        baseline: { x0: 10, y0: 39, x1: 70, y1: 39 },
        rowAttributes: { rowHeight: 24 },
        words: [{ text: "Garrett", confidence: 96, font_name: "Arial Bold", bbox: { x0: 10, y0: 20, x1: 70, y1: 40 } }],
      },
      { words: [{ text: "Private", confidence: 91, bbox: { x0: 10, y0: 50, x1: 65, y1: 70 } }] },
    ] }] }],
  });

  assert.equal(words.length, 2);
  assert.equal(words[0].text, "Garrett");
  assert.notEqual(words[0].lineId, words[1].lineId);
  assert.deepEqual(words[0].bbox, { x0: 10, y0: 20, x1: 70, y1: 40 });
  assert.equal(words[0].fontName, "Arial Bold");
  assert.equal(words[0].rowHeight, 24);
  assert.equal(words[0].baseline.y0, 39);
});

test("finds a case-insensitive phrase on one OCR line and combines its bounds", () => {
  const words = [
    { id: "1", lineId: "a", text: "Garrett", confidence: 98, bbox: { x0: 10, y0: 20, x1: 70, y1: 40 } },
    { id: "2", lineId: "a", text: "Allen", confidence: 94, bbox: { x0: 76, y0: 20, x1: 116, y1: 40 } },
    { id: "3", lineId: "b", text: "Garrett", confidence: 99, bbox: { x0: 10, y0: 50, x1: 70, y1: 70 } },
  ];
  const matches = findPhraseMatches(words, "garrett allen");

  assert.equal(matches.length, 1);
  assert.equal(matches[0].text, "Garrett Allen");
  assert.equal(matches[0].confidence, 96);
  assert.deepEqual(matches[0].bbox, { x0: 10, y0: 20, x1: 116, y1: 40 });
});

test("supports partial single-word searches without crossing line boundaries", () => {
  const words = [
    { id: "1", lineId: "a", text: "SearchCarriers", confidence: 96, bbox: { x0: 2, y0: 2, x1: 100, y1: 22 } },
    { id: "2", lineId: "b", text: "Search", confidence: 96, bbox: { x0: 2, y0: 30, x1: 50, y1: 50 } },
    { id: "3", lineId: "c", text: "Carriers", confidence: 96, bbox: { x0: 2, y0: 60, x1: 62, y1: 80 } },
  ];

  assert.equal(findPhraseMatches(words, "carrier", { wholeWord: false }).length, 2);
  assert.equal(findPhraseMatches(words, "Search Carriers").length, 0);
});

test("carries the dominant OCR font hint into phrase matches", () => {
  const words = [
    { id: "1", lineId: "a", text: "Private", confidence: 96, fontName: "Courier New Bold", bbox: { x0: 2, y0: 2, x1: 54, y1: 22 } },
    { id: "2", lineId: "a", text: "Name", confidence: 94, fontName: "Courier New Bold", bbox: { x0: 58, y0: 2, x1: 92, y1: 22 } },
  ];
  const [match] = findPhraseMatches(words, "Private Name");

  assert.equal(match.fontName, "Courier New Bold");
  assert.equal(inferFontFamily(match.fontName), "mono");
  assert.equal(inferFontWeight(match.fontName), "bold");
  assert.equal(inferFontFamily("Georgia Regular"), "serif");
  assert.equal(inferFontWeight("", 0.2), "normal");
  assert.equal(inferFontWeight("", 0.4), "bold");
});

test("estimates surrounding background and contrasting text colors", () => {
  const width = 20;
  const height = 12;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = 240;
    data[index + 1] = 240;
    data[index + 2] = 240;
    data[index + 3] = 255;
  }
  for (let y = 4; y < 8; y += 1) {
    for (let x = 7; x < 13; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = 20;
      data[index + 1] = 33;
      data[index + 2] = 61;
    }
  }
  const appearance = estimatePatchAppearance(
    { width, height, data },
    { x0: 5, y0: 3, x1: 15, y1: 9 },
  );

  assert.equal(appearance.backgroundColor, "#f0f0f0");
  assert.equal(appearance.textColor, "#14213d");
  assert.ok(appearance.backgroundConfidence > 0.9);
  assert.ok(appearance.foregroundCoverage > 0);
  assert.deepEqual(paddedBounds({ x0: 5, y0: 3, x1: 15, y1: 9 }, 2, width, height), {
    x: 3,
    y: 1,
    width: 14,
    height: 10,
  });
});
