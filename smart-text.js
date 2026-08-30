(function attachPatchworkSmartText(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PatchworkSmartText = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  function bboxFor(value = {}) {
    const source = value.bbox || value;
    const x0 = Number(source.x0 ?? source.left ?? source.x ?? 0);
    const y0 = Number(source.y0 ?? source.top ?? source.y ?? 0);
    const x1 = Number(source.x1 ?? source.right ?? (x0 + Number(source.width || 0)));
    const y1 = Number(source.y1 ?? source.bottom ?? (y0 + Number(source.height || 0)));
    return {
      x0: Math.min(x0, x1),
      y0: Math.min(y0, y1),
      x1: Math.max(x0, x1),
      y1: Math.max(y0, y1),
    };
  }

  function extractOcrWords(data = {}) {
    const words = [];
    let lineIndex = 0;

    function addLine(line = {}) {
      const lineId = `line-${lineIndex++}`;
      (line.words || []).forEach((word) => {
        const text = String(word.text || "").trim();
        if (!text) return;
        words.push({
          id: `word-${words.length}`,
          lineId,
          text,
          confidence: Number.isFinite(Number(word.confidence)) ? Number(word.confidence) : 0,
          bbox: bboxFor(word),
          fontName: String(word.font_name || word.fontName || "").trim(),
          baseline: line.baseline ? {
            x0: Number(line.baseline.x0 || 0),
            y0: Number(line.baseline.y0 || 0),
            x1: Number(line.baseline.x1 || 0),
            y1: Number(line.baseline.y1 || 0),
          } : null,
          rowHeight: Number(line.rowAttributes?.rowHeight || 0),
        });
      });
    }

    (data.blocks || []).forEach((block) => {
      (block.paragraphs || []).forEach((paragraph) => {
        (paragraph.lines || []).forEach(addLine);
      });
    });

    if (!words.length && Array.isArray(data.lines)) data.lines.forEach(addLine);
    if (!words.length && Array.isArray(data.words)) {
      data.words.forEach((word) => addLine({ words: [word] }));
    }
    return words;
  }

  function normalizedToken(value, caseSensitive) {
    const trimmed = String(value || "")
      .trim()
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    return caseSensitive ? trimmed : trimmed.toLocaleLowerCase();
  }

  function unionBboxes(words) {
    const boxes = words.map((word) => bboxFor(word.bbox));
    return {
      x0: Math.min(...boxes.map((box) => box.x0)),
      y0: Math.min(...boxes.map((box) => box.y0)),
      x1: Math.max(...boxes.map((box) => box.x1)),
      y1: Math.max(...boxes.map((box) => box.y1)),
    };
  }

  function mostFrequent(values = []) {
    const counts = new Map();
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || "";
  }

  function inferFontFamily(fontName = "") {
    const normalized = String(fontName).toLocaleLowerCase();
    if (/mono|courier|consolas|typewriter|code/.test(normalized)) return "mono";
    if (/serif|times|georgia|garamond|cambria|baskerville|roman/.test(normalized)) return "serif";
    if (/script|hand|comic|cursive|marker|brush/.test(normalized)) return "hand";
    return "sans";
  }

  function inferFontWeight(fontName = "", foregroundCoverage = 0) {
    const normalized = String(fontName).toLocaleLowerCase();
    if (/bold|black|heavy|semibold|demi|extrabold/.test(normalized)) return "bold";
    if (/light|thin|regular|book|normal/.test(normalized)) return "normal";
    return Number(foregroundCoverage) >= 0.32 ? "bold" : "normal";
  }

  function findPhraseMatches(words = [], query = "", { caseSensitive = false, wholeWord = true } = {}) {
    const queryTokens = String(query).trim().split(/\s+/).map((token) => normalizedToken(token, caseSensitive)).filter(Boolean);
    if (!queryTokens.length) return [];

    const matches = [];
    for (let index = 0; index <= words.length - queryTokens.length; index += 1) {
      const candidates = words.slice(index, index + queryTokens.length);
      if (candidates.some((word) => word.lineId !== candidates[0].lineId)) continue;
      const candidateTokens = candidates.map((word) => normalizedToken(word.text, caseSensitive));
      const matchesQuery = queryTokens.length === 1 && !wholeWord
        ? candidateTokens[0].includes(queryTokens[0])
        : candidateTokens.every((token, tokenIndex) => token === queryTokens[tokenIndex]);
      if (!matchesQuery) continue;

      matches.push({
        id: `match-${matches.length}`,
        text: candidates.map((word) => word.text).join(" "),
        confidence: candidates.reduce((total, word) => total + word.confidence, 0) / candidates.length,
        bbox: unionBboxes(candidates),
        wordIds: candidates.map((word) => word.id),
        fontName: mostFrequent(candidates.map((word) => word.fontName)),
        baseline: candidates.find((word) => word.baseline)?.baseline || null,
        rowHeight: Math.max(0, ...candidates.map((word) => Number(word.rowHeight || 0))),
      });
      index += queryTokens.length - 1;
    }
    return matches;
  }

  function colorDistance(left, right) {
    return Math.sqrt(
      (left[0] - right[0]) ** 2
      + (left[1] - right[1]) ** 2
      + (left[2] - right[2]) ** 2,
    );
  }

  function dominantColor(samples) {
    if (!samples.length) return { color: [255, 255, 255], share: 0 };
    const buckets = new Map();
    samples.forEach((sample) => {
      const key = `${sample[0] >> 5}-${sample[1] >> 5}-${sample[2] >> 5}`;
      const bucket = buckets.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += 1;
      bucket.red += sample[0];
      bucket.green += sample[1];
      bucket.blue += sample[2];
      buckets.set(key, bucket);
    });
    const winner = [...buckets.values()].sort((left, right) => right.count - left.count)[0];
    return {
      color: [winner.red, winner.green, winner.blue].map((value) => Math.round(value / winner.count)),
      share: winner.count / samples.length,
    };
  }

  function hexColor(color) {
    return `#${color.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
  }

  function pixelAt(imageData, x, y) {
    const index = (y * imageData.width + x) * 4;
    return [imageData.data[index], imageData.data[index + 1], imageData.data[index + 2]];
  }

  function estimatePatchAppearance(imageData, value = {}) {
    const box = bboxFor(value);
    const x0 = Math.max(0, Math.floor(box.x0));
    const y0 = Math.max(0, Math.floor(box.y0));
    const x1 = Math.min(imageData.width, Math.ceil(box.x1));
    const y1 = Math.min(imageData.height, Math.ceil(box.y1));
    const width = Math.max(1, x1 - x0);
    const height = Math.max(1, y1 - y0);
    const padding = Math.max(2, Math.min(10, Math.round(Math.min(width, height) * 0.18)));
    const outer = {
      x0: Math.max(0, x0 - padding),
      y0: Math.max(0, y0 - padding),
      x1: Math.min(imageData.width, x1 + padding),
      y1: Math.min(imageData.height, y1 + padding),
    };
    const area = Math.max(1, (outer.x1 - outer.x0) * (outer.y1 - outer.y0));
    const step = Math.max(1, Math.floor(Math.sqrt(area / 6000)));
    const ringPixels = [];
    for (let y = outer.y0; y < outer.y1; y += step) {
      for (let x = outer.x0; x < outer.x1; x += step) {
        if (x >= x0 && x < x1 && y >= y0 && y < y1) continue;
        ringPixels.push(pixelAt(imageData, x, y));
      }
    }

    if (!ringPixels.length) {
      [[x0, y0], [x1 - 1, y0], [x0, y1 - 1], [x1 - 1, y1 - 1]].forEach(([x, y]) => {
        ringPixels.push(pixelAt(imageData, Math.max(0, x), Math.max(0, y)));
      });
    }
    const background = dominantColor(ringPixels);

    const foregroundPixels = [];
    let sampledInnerPixels = 0;
    for (let y = y0; y < y1; y += step) {
      for (let x = x0; x < x1; x += step) {
        sampledInnerPixels += 1;
        const pixel = pixelAt(imageData, x, y);
        if (colorDistance(pixel, background.color) >= 52) foregroundPixels.push(pixel);
      }
    }
    const foreground = dominantColor(foregroundPixels);
    if (!foregroundPixels.length) {
      const luminance = background.color[0] * 0.299 + background.color[1] * 0.587 + background.color[2] * 0.114;
      foreground.color = luminance > 150 ? [20, 33, 61] : [255, 255, 255];
    }

    return {
      backgroundColor: hexColor(background.color),
      textColor: hexColor(foreground.color),
      backgroundConfidence: background.share,
      foregroundCoverage: foregroundPixels.length / Math.max(1, sampledInnerPixels),
      padding,
    };
  }

  function paddedBounds(value, padding, imageWidth, imageHeight) {
    const box = bboxFor(value);
    const x = Math.max(0, Math.floor(box.x0 - padding));
    const y = Math.max(0, Math.floor(box.y0 - padding));
    const right = Math.min(imageWidth, Math.ceil(box.x1 + padding));
    const bottom = Math.min(imageHeight, Math.ceil(box.y1 + padding));
    return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
  }

  return {
    extractOcrWords,
    findPhraseMatches,
    estimatePatchAppearance,
    inferFontFamily,
    inferFontWeight,
    paddedBounds,
  };
}));
