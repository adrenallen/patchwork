(function attachPatchworkShareLayout(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PatchworkShareLayout = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const DEFAULT_MAX_DIMENSION = 12000;
  const DEFAULT_MAX_PIXELS = 48_000_000;

  function positiveNumber(value, fallback = 1) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function nonNegativeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  }

  function constrainDimensions(width, height, maxDimension, maxPixels) {
    let safeWidth = Math.max(1, Math.ceil(width));
    let safeHeight = Math.max(1, Math.ceil(height));
    const dimensionScale = Math.min(1, maxDimension / safeWidth, maxDimension / safeHeight);
    if (dimensionScale < 1) {
      safeWidth = Math.max(1, Math.floor(safeWidth * dimensionScale));
      safeHeight = Math.max(1, Math.floor(safeHeight * dimensionScale));
    }
    if (safeWidth * safeHeight > maxPixels) {
      const pixelScale = Math.sqrt(maxPixels / (safeWidth * safeHeight));
      safeWidth = Math.max(1, Math.floor(safeWidth * pixelScale));
      safeHeight = Math.max(1, Math.floor(safeHeight * pixelScale));
    }
    return {
      width: safeWidth,
      height: safeHeight,
      constrained: safeWidth < Math.ceil(width) || safeHeight < Math.ceil(height),
    };
  }

  function calculateShareLayout({
    requestedWidth,
    requestedHeight,
    contentWidth,
    contentHeight,
    paddingPercent = 0,
    paddingX,
    paddingY,
    paddingUnit = "percent",
    reflection = false,
    fixImageBlur = false,
    maxDimension = DEFAULT_MAX_DIMENSION,
    maxPixels = DEFAULT_MAX_PIXELS,
  }) {
    const requested = {
      width: positiveNumber(requestedWidth),
      height: positiveNumber(requestedHeight),
    };
    const content = {
      width: positiveNumber(contentWidth),
      height: positiveNumber(contentHeight),
    };
    const resolvedPaddingX = nonNegativeNumber(paddingX, nonNegativeNumber(paddingPercent));
    const resolvedPaddingY = nonNegativeNumber(paddingY, nonNegativeNumber(paddingPercent));
    const usesPixels = paddingUnit === "pixels";
    const paddingRatioX = usesPixels ? 0 : Math.min(0.49, resolvedPaddingX / 100);
    const paddingRatioY = usesPixels ? 0 : Math.min(0.49, resolvedPaddingY / 100);
    const availableRatioX = Math.max(0.02, 1 - paddingRatioX * 2);
    const availableRatioY = Math.max(0.02, 1 - paddingRatioY * 2);
    const desiredScale = fixImageBlur
      ? 1
      : Math.min(requested.width / content.width, requested.height / content.height);
    const desiredWidth = content.width * desiredScale;
    const desiredHeight = content.height * desiredScale;
    const desiredReflectionHeight = reflection ? desiredHeight * 0.22 : 0;
    const desiredReflectionGap = reflection ? Math.max(3, desiredHeight * 0.018) : 0;

    let outputWidth = requested.width;
    let outputHeight = requested.height;
    if (fixImageBlur) {
      const requiredWidth = usesPixels
        ? desiredWidth + resolvedPaddingX * 2
        : desiredWidth / availableRatioX;
      const requiredHeight = usesPixels
        ? desiredHeight + desiredReflectionHeight + desiredReflectionGap + resolvedPaddingY * 2
        : (desiredHeight + desiredReflectionHeight + desiredReflectionGap) / availableRatioY;
      const expansion = Math.max(1, requiredWidth / requested.width, requiredHeight / requested.height);
      outputWidth *= expansion;
      outputHeight *= expansion;
    }

    const dimensions = constrainDimensions(
      outputWidth,
      outputHeight,
      positiveNumber(maxDimension, DEFAULT_MAX_DIMENSION),
      positiveNumber(maxPixels, DEFAULT_MAX_PIXELS),
    );
    const availableWidth = Math.max(
      1,
      usesPixels ? dimensions.width - resolvedPaddingX * 2 : dimensions.width * availableRatioX,
    );
    const availableHeight = Math.max(
      1,
      usesPixels ? dimensions.height - resolvedPaddingY * 2 : dimensions.height * availableRatioY,
    );
    const reflectionSpace = reflection ? 1.24 : 1;
    const fittedScale = Math.min(
      availableWidth / content.width,
      availableHeight / (content.height * reflectionSpace),
    );
    const scale = fixImageBlur && !dimensions.constrained ? desiredScale : fittedScale;
    const width = content.width * scale;
    const height = content.height * scale;
    const reflectionHeight = reflection ? height * 0.22 : 0;
    const reflectionGap = reflection ? Math.max(3, height * 0.018) : 0;
    const rawX = (dimensions.width - width) / 2;
    const rawY = (dimensions.height - height - reflectionHeight - reflectionGap) / 2;
    const snapToPixels = Math.abs(scale - Math.round(scale)) < 1e-9;

    return {
      dimensions: { width: dimensions.width, height: dimensions.height },
      constrained: dimensions.constrained,
      padding: {
        unit: usesPixels ? "pixels" : "percent",
        x: resolvedPaddingX,
        y: resolvedPaddingY,
      },
      content: {
        x: snapToPixels ? Math.round(rawX) : rawX,
        y: snapToPixels ? Math.round(rawY) : rawY,
        width,
        height,
        scale,
      },
      reflection: {
        height: reflectionHeight,
        gap: reflectionGap,
      },
    };
  }

  function mapDocumentBounds(bounds, transform) {
    return {
      x: transform.x + bounds.x * transform.scale,
      y: transform.y + bounds.y * transform.scale,
      width: bounds.width * transform.scale,
      height: bounds.height * transform.scale,
    };
  }

  function unmapShareBounds(bounds, transform) {
    return {
      x: (bounds.x - transform.x) / transform.scale,
      y: (bounds.y - transform.y) / transform.scale,
      width: bounds.width / transform.scale,
      height: bounds.height / transform.scale,
    };
  }

  return { calculateShareLayout, mapDocumentBounds, unmapShareBounds };
}));
