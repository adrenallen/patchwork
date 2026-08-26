(() => {
  const canvas = document.querySelector("#editorCanvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const baseCanvas = document.createElement("canvas");
  const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });

  const elements = {
    fileInput: document.querySelector("#fileInput"),
    replaceImageButton: document.querySelector("#replaceImageButton"),
    pasteCard: document.querySelector("#pasteCard"),
    emptyState: document.querySelector("#emptyState"),
    canvasWrap: document.querySelector("#canvasWrap"),
    framePreview: document.querySelector("#framePreview"),
    editControls: document.querySelector("#editControls"),
    maskModeButton: document.querySelector("#maskModeButton"),
    textModeButton: document.querySelector("#textModeButton"),
    textOptions: document.querySelector("#textOptions"),
    backgroundColor: document.querySelector("#backgroundColor"),
    backgroundColorValue: document.querySelector("#backgroundColorValue"),
    patternButtons: [...document.querySelectorAll(".pattern-button")],
    replacementText: document.querySelector("#replacementText"),
    textColor: document.querySelector("#textColor"),
    textColorValue: document.querySelector("#textColorValue"),
    textStyleButtons: [...document.querySelectorAll(".text-style-button")],
    fontSize: document.querySelector("#fontSize"),
    fontSizeValue: document.querySelector("#fontSizeValue"),
    autoTextSize: document.querySelector("#autoTextSize"),
    applyButton: document.querySelector("#applyButton"),
    applyButtonLabel: document.querySelector("#applyButtonLabel"),
    undoButton: document.querySelector("#undoButton"),
    redoButton: document.querySelector("#redoButton"),
    clearSelectionButton: document.querySelector("#clearSelectionButton"),
    copyButton: document.querySelector("#copyButton"),
    downloadButton: document.querySelector("#downloadButton"),
    selectionReadout: document.querySelector("#selectionReadout"),
    imageMeta: document.querySelector("#imageMeta"),
    workspaceTip: document.querySelector("#workspaceTip"),
    recentList: document.querySelector("#recentList"),
    recentEmpty: document.querySelector("#recentEmpty"),
    clearRecentButton: document.querySelector("#clearRecentButton"),
    recentImagesList: document.querySelector("#recentImagesList"),
    recentImagesEmpty: document.querySelector("#recentImagesEmpty"),
    clearRecentImagesButton: document.querySelector("#clearRecentImagesButton"),
    frameEnabled: document.querySelector("#frameEnabled"),
    frameToggleLabel: document.querySelector("#frameToggleLabel"),
    presentationControls: document.querySelector("#presentationControls"),
    ratioButtons: [...document.querySelectorAll(".ratio-button")],
    outputWidth: document.querySelector("#outputWidth"),
    outputHeight: document.querySelector("#outputHeight"),
    matchImageRatio: document.querySelector("#matchImageRatio"),
    customSizeNote: document.querySelector("#customSizeNote"),
    gradientButtons: [...document.querySelectorAll(".gradient-button")],
    framePadding: document.querySelector("#framePadding"),
    framePaddingValue: document.querySelector("#framePaddingValue"),
    cornerRadius: document.querySelector("#cornerRadius"),
    cornerRadiusValue: document.querySelector("#cornerRadiusValue"),
    toast: document.querySelector("#toast"),
  };

  const STORAGE_KEYS = {
    backgroundColor: "patchwork.backgroundColor",
    textColor: "patchwork.textColor",
    textStyle: "patchwork.textStyle",
    fontSize: "patchwork.fontSize",
    autoTextSize: "patchwork.autoTextSize",
    pattern: "patchwork.pattern",
    recentPatches: "patchwork.recentPatches",
    frameEnabled: "patchwork.frameEnabled",
    aspectPreset: "patchwork.aspectPreset",
    outputWidth: "patchwork.outputWidth",
    outputHeight: "patchwork.outputHeight",
    matchImageRatio: "patchwork.matchImageRatio",
    gradient: "patchwork.gradient",
    framePadding: "patchwork.framePadding",
    cornerRadius: "patchwork.cornerRadius",
  };

  const GRADIENTS = {
    dusk: { angle: 135, stops: ["#5b4bdb", "#b44ad7", "#f28b66"] },
    tide: { angle: 135, stops: ["#08b6d8", "#2563eb", "#6336cc"] },
    mango: { angle: 135, stops: ["#ffd36e", "#ff8a65", "#c45acb"] },
    iris: { angle: 135, stops: ["#363795", "#8b5cf6", "#ec4899"] },
    mint: { angle: 135, stops: ["#b9fbc0", "#39c6b0", "#157a87"] },
    graphite: { angle: 135, stops: ["#64748b", "#26354b", "#0f172a"] },
  };

  const IMAGE_DB_NAME = "patchwork-image-history";
  const IMAGE_DB_VERSION = 1;
  const IMAGE_STORE_NAME = "images";
  const MAX_SAVED_IMAGES = 7;
  const MAX_RECENT_PATCHES = 10;

  let imageLoaded = false;
  let imageName = "image";
  let imageLabel = "Pasted image";
  let mode = "mask";
  let pattern = "solid";
  let textStyle = "bold";
  let frameEnabled = false;
  let aspectPreset = "square";
  let matchImageRatio = true;
  let gradientName = "dusk";
  let selection = null;
  let dragStart = null;
  let isSelecting = false;
  let history = [];
  let future = [];
  let isRestoring = false;
  let recentPatches = [];
  let savedImages = [];
  let currentImageId = null;
  let imageDatabasePromise = null;
  let imageSaveTimer = null;
  let imageSaveQueue = Promise.resolve(true);
  let recentImageUrls = [];
  let isSwitchingImages = false;
  let imageStorageWarningShown = false;
  let toastTimer = null;

  function readPreference(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function savePreference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // The editor still works when storage is unavailable.
    }
  }

  function createImageId() {
    if (typeof window.crypto?.randomUUID === "function") return window.crypto.randomUUID();
    return `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function openImageDatabase() {
    if (imageDatabasePromise) return imageDatabasePromise;
    if (!window.indexedDB) {
      imageDatabasePromise = Promise.resolve(null);
      return imageDatabasePromise;
    }

    imageDatabasePromise = new Promise((resolve) => {
      let request;
      try {
        request = window.indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
      } catch {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const database = request.result;
        if (database.objectStoreNames.contains(IMAGE_STORE_NAME)) return;
        const store = database.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
    return imageDatabasePromise;
  }

  function transactionComplete(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Image storage failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Image storage was interrupted."));
    });
  }

  async function readImageRecords() {
    const database = await openImageDatabase();
    if (!database) return [];

    return new Promise((resolve) => {
      const transaction = database.transaction(IMAGE_STORE_NAME, "readonly");
      const request = transaction.objectStore(IMAGE_STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async function storeImageRecord(record) {
    const database = await openImageDatabase();
    if (!database) throw new Error("Local image storage is unavailable.");

    const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    store.put(record);
    const allRecords = store.getAll();
    allRecords.onsuccess = () => {
      allRecords.result
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(MAX_SAVED_IMAGES)
        .forEach((oldRecord) => store.delete(oldRecord.id));
    };
    await transactionComplete(transaction);
  }

  async function clearImageRecords() {
    const database = await openImageDatabase();
    if (!database) return;
    const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
    transaction.objectStore(IMAGE_STORE_NAME).clear();
    await transactionComplete(transaction);
  }

  function canvasBlob(sourceCanvas, type = "image/png", quality) {
    return new Promise((resolve, reject) => {
      sourceCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The image could not be created."));
      }, type, quality);
    });
  }

  async function createThumbnailBlob() {
    const maximumWidth = 260;
    const maximumHeight = 150;
    const scale = Math.min(maximumWidth / baseCanvas.width, maximumHeight / baseCanvas.height, 1);
    const thumbnail = document.createElement("canvas");
    thumbnail.width = Math.max(1, Math.round(baseCanvas.width * scale));
    thumbnail.height = Math.max(1, Math.round(baseCanvas.height * scale));
    const thumbnailContext = thumbnail.getContext("2d");
    thumbnailContext.imageSmoothingEnabled = true;
    thumbnailContext.imageSmoothingQuality = "high";
    thumbnailContext.drawImage(baseCanvas, 0, 0, thumbnail.width, thumbnail.height);
    return canvasBlob(thumbnail, "image/webp", 0.82);
  }

  function formatSavedTime(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }

  function renderRecentImages() {
    recentImageUrls.forEach((url) => URL.revokeObjectURL(url));
    recentImageUrls = [];
    elements.recentImagesList.querySelectorAll(".recent-image").forEach((item) => item.remove());

    const previousImages = savedImages
      .filter((record) => record.id !== currentImageId)
      .slice(0, MAX_SAVED_IMAGES);
    elements.recentImagesEmpty.hidden = previousImages.length > 0;
    elements.clearRecentImagesButton.hidden = previousImages.length === 0;

    previousImages.forEach((record) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-image";
      button.disabled = isSwitchingImages;
      button.setAttribute("aria-label", `Open saved image ${record.label || record.name}`);

      const preview = document.createElement("img");
      const previewUrl = URL.createObjectURL(record.thumbnailBlob || record.blob);
      recentImageUrls.push(previewUrl);
      preview.src = previewUrl;
      preview.alt = "";

      const copy = document.createElement("span");
      copy.className = "recent-image-copy";
      const title = document.createElement("strong");
      title.textContent = record.label || record.name || "Saved image";
      const detail = document.createElement("small");
      detail.textContent = `${record.width} × ${record.height} · ${formatSavedTime(record.updatedAt)}`;
      copy.append(title, detail);

      button.append(preview, copy);
      button.addEventListener("click", () => restoreSavedImage(record.id));
      elements.recentImagesList.append(button);
    });
  }

  async function loadSavedImages() {
    try {
      savedImages = (await readImageRecords()).sort((left, right) => right.updatedAt - left.updatedAt);
    } catch {
      savedImages = [];
    }
    renderRecentImages();
  }

  function warnAboutImageStorage() {
    if (imageStorageWarningShown) return;
    imageStorageWarningShown = true;
    showToast("Image history could not be saved. Browser storage may be unavailable or full.");
  }

  function saveCurrentImage({ notifyFailure = false, refresh = true } = {}) {
    window.clearTimeout(imageSaveTimer);
    imageSaveTimer = null;
    if (!imageLoaded || !currentImageId) return Promise.resolve(true);

    const record = {
      id: currentImageId,
      name: imageName,
      label: imageLabel,
      width: baseCanvas.width,
      height: baseCanvas.height,
      updatedAt: Date.now(),
    };
    const blobs = Promise.all([canvasBlob(baseCanvas), createThumbnailBlob()]).then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    const save = async () => {
      try {
        const blobResult = await blobs;
        if (blobResult.error) throw blobResult.error;
        const [blob, thumbnailBlob] = blobResult.value;
        await storeImageRecord({ ...record, blob, thumbnailBlob });
        if (refresh) await loadSavedImages();
        return true;
      } catch {
        if (notifyFailure) warnAboutImageStorage();
        return false;
      }
    };
    imageSaveQueue = imageSaveQueue.then(save, save);
    return imageSaveQueue;
  }

  function scheduleCurrentImageSave() {
    window.clearTimeout(imageSaveTimer);
    imageSaveTimer = window.setTimeout(() => {
      imageSaveTimer = null;
      saveCurrentImage();
    }, 500);
  }

  function initializePreferences() {
    elements.backgroundColor.value = readPreference(STORAGE_KEYS.backgroundColor, "#111827");
    elements.textColor.value = readPreference(STORAGE_KEYS.textColor, "#ffffff");
    elements.fontSize.value = readPreference(STORAGE_KEYS.fontSize, "28");
    elements.autoTextSize.checked = readPreference(STORAGE_KEYS.autoTextSize, "true") === "true";
    const savedTextStyle = readPreference(STORAGE_KEYS.textStyle, "bold");
    setTextStyle(["normal", "bold", "italic"].includes(savedTextStyle) ? savedTextStyle : "bold", false);
    const savedPattern = readPreference(STORAGE_KEYS.pattern, "solid");
    setPattern(["solid", "diagonal", "hatch"].includes(savedPattern) ? savedPattern : "solid", false);
    frameEnabled = readPreference(STORAGE_KEYS.frameEnabled, "false") === "true";
    aspectPreset = readPreference(STORAGE_KEYS.aspectPreset, "square");
    matchImageRatio = readPreference(STORAGE_KEYS.matchImageRatio, "true") === "true";
    if (matchImageRatio) aspectPreset = "source";
    gradientName = readPreference(STORAGE_KEYS.gradient, "dusk");
    if (gradientName !== "transparent" && !GRADIENTS[gradientName]) gradientName = "dusk";
    elements.frameEnabled.checked = frameEnabled;
    elements.matchImageRatio.checked = matchImageRatio;
    elements.outputWidth.value = String(clampNumber(readPreference(STORAGE_KEYS.outputWidth, "1600"), 1, 12000, 1600));
    elements.outputHeight.value = String(clampNumber(readPreference(STORAGE_KEYS.outputHeight, "1600"), 1, 12000, 1600));
    elements.framePadding.value = String(clampNumber(readPreference(STORAGE_KEYS.framePadding, "10"), 0, 24, 10));
    elements.cornerRadius.value = String(clampNumber(readPreference(STORAGE_KEYS.cornerRadius, "24"), 0, 64, 24));
    updatePresentationUI();
    loadRecentPatches();
    updatePreferenceLabels();
  }

  function clampNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.round(number))) : fallback;
  }

  function getOutputDimensions() {
    let width = clampNumber(elements.outputWidth.value, 1, 12000, imageLoaded ? baseCanvas.width : 1600);
    let height = clampNumber(elements.outputHeight.value, 1, 12000, imageLoaded ? baseCanvas.height : 1600);
    const pixelLimit = 48_000_000;
    if (width * height > pixelLimit) {
      const scale = Math.sqrt(pixelLimit / (width * height));
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
    }
    return { width, height };
  }

  function gradientCss(name = gradientName) {
    if (name === "transparent") return "transparent";
    const gradient = GRADIENTS[name] || GRADIENTS.dusk;
    return `linear-gradient(${gradient.angle}deg, ${gradient.stops.join(", ")})`;
  }

  function frameBackgroundIsTransparent() {
    return gradientName === "transparent" || Number(elements.framePadding.value) === 0;
  }

  function updatePresentationUI() {
    elements.frameEnabled.checked = frameEnabled;
    elements.matchImageRatio.checked = matchImageRatio;
    elements.frameToggleLabel.textContent = frameEnabled ? "On" : "Off";
    elements.presentationControls.hidden = !frameEnabled;
    elements.framePaddingValue.value = `${elements.framePadding.value}%`;
    elements.cornerRadiusValue.value = `${elements.cornerRadius.value} px`;

    elements.ratioButtons.forEach((button) => {
      const isActive = button.dataset.aspect === aspectPreset;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    elements.gradientButtons.forEach((button) => {
      const isActive = button.dataset.gradient === gradientName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const presetButton = elements.ratioButtons.find((button) => button.dataset.aspect === aspectPreset);
    if (matchImageRatio) {
      elements.customSizeNote.textContent = imageLoaded
        ? `Matches ${baseCanvas.width} × ${baseCanvas.height} source ratio · pixels`
        : "Waiting for an image · pixels";
    } else {
      elements.customSizeNote.textContent = presetButton
        ? `${presetButton.querySelector("strong").textContent} preset · pixels`
        : "Custom size · pixels";
    }
    updateFramePreview();
  }

  function setAspectPreset(button) {
    matchImageRatio = false;
    aspectPreset = button.dataset.aspect;
    elements.matchImageRatio.checked = false;
    elements.outputWidth.value = button.dataset.width;
    elements.outputHeight.value = button.dataset.height;
    savePreference(STORAGE_KEYS.matchImageRatio, "false");
    savePreference(STORAGE_KEYS.aspectPreset, aspectPreset);
    savePreference(STORAGE_KEYS.outputWidth, elements.outputWidth.value);
    savePreference(STORAGE_KEYS.outputHeight, elements.outputHeight.value);
    updatePresentationUI();
  }

  function syncOutputToSourceSize() {
    if (!imageLoaded) return;
    aspectPreset = "source";
    elements.outputWidth.value = String(baseCanvas.width);
    elements.outputHeight.value = String(baseCanvas.height);
    savePreference(STORAGE_KEYS.aspectPreset, aspectPreset);
    savePreference(STORAGE_KEYS.outputWidth, elements.outputWidth.value);
    savePreference(STORAGE_KEYS.outputHeight, elements.outputHeight.value);
  }

  function setCustomDimensions(changedInput) {
    let width = Number(elements.outputWidth.value);
    let height = Number(elements.outputHeight.value);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;

    if (matchImageRatio && imageLoaded) {
      const sourceRatio = baseCanvas.width / baseCanvas.height;
      if (changedInput === elements.outputHeight) {
        width = Math.max(1, Math.round(height * sourceRatio));
        elements.outputWidth.value = String(width);
      } else {
        height = Math.max(1, Math.round(width / sourceRatio));
        elements.outputHeight.value = String(height);
      }
      aspectPreset = "source";
    } else {
      aspectPreset = "custom";
    }
    savePreference(STORAGE_KEYS.aspectPreset, aspectPreset);
    savePreference(STORAGE_KEYS.outputWidth, elements.outputWidth.value);
    savePreference(STORAGE_KEYS.outputHeight, elements.outputHeight.value);
    updatePresentationUI();
  }

  function normalizeDimensionInputs() {
    let dimensions = getOutputDimensions();
    if (matchImageRatio && imageLoaded) {
      const sourceRatio = baseCanvas.width / baseCanvas.height;
      dimensions = {
        width: dimensions.width,
        height: Math.max(1, Math.round(dimensions.width / sourceRatio)),
      };
      if (dimensions.width * dimensions.height > 48_000_000) {
        const scale = Math.sqrt(48_000_000 / (dimensions.width * dimensions.height));
        dimensions.width = Math.max(1, Math.floor(dimensions.width * scale));
        dimensions.height = Math.max(1, Math.floor(dimensions.height * scale));
      }
    }
    elements.outputWidth.value = String(dimensions.width);
    elements.outputHeight.value = String(dimensions.height);
    savePreference(STORAGE_KEYS.outputWidth, elements.outputWidth.value);
    savePreference(STORAGE_KEYS.outputHeight, elements.outputHeight.value);
    updatePresentationUI();
  }

  function setGradient(name) {
    gradientName = (name === "transparent" || GRADIENTS[name]) ? name : "dusk";
    savePreference(STORAGE_KEYS.gradient, gradientName);
    updatePresentationUI();
  }

  function setMatchImageRatio(enabled) {
    matchImageRatio = enabled;
    savePreference(STORAGE_KEYS.matchImageRatio, String(matchImageRatio));
    if (matchImageRatio) {
      aspectPreset = "source";
      syncOutputToSourceSize();
    } else {
      aspectPreset = "custom";
      savePreference(STORAGE_KEYS.aspectPreset, aspectPreset);
    }
    updatePresentationUI();
  }

  function updatePreferenceLabels() {
    elements.backgroundColorValue.value = elements.backgroundColor.value.toUpperCase();
    elements.textColorValue.value = elements.textColor.value.toUpperCase();
    updateFontSizeUI();
    const lineColor = getPatternLineColor(elements.backgroundColor.value, 0.32);
    elements.patternButtons.forEach((button) => {
      button.style.setProperty("--sample-color", elements.backgroundColor.value);
      button.style.setProperty("--sample-line", lineColor);
    });
  }

  function fontFamily() {
    return getComputedStyle(document.documentElement).getPropertyValue("--body");
  }

  function canvasFont(size) {
    const weight = textStyle === "bold" ? 700 : 400;
    const italic = textStyle === "italic" ? "italic " : "";
    return `${italic}${weight} ${size}px ${fontFamily()}`;
  }

  function setTextStyle(nextStyle, remember = true) {
    textStyle = ["normal", "bold", "italic"].includes(nextStyle) ? nextStyle : "bold";
    elements.textStyleButtons.forEach((button) => {
      const isActive = button.dataset.textStyle === textStyle;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (remember) savePreference(STORAGE_KEYS.textStyle, textStyle);
    updateFontSizeUI();
    render();
  }

  function effectiveFontSize(targetContext = context) {
    const manualSize = Number(elements.fontSize.value);
    if (!elements.autoTextSize.checked || !selection) return manualSize;

    const text = elements.replacementText.value.trim();
    let size = Math.max(1, selection.height * 0.62);
    if (!text) return size;

    for (let pass = 0; pass < 2; pass += 1) {
      const padding = Math.max(4, Math.min(size * 0.42, selection.width * 0.08));
      const availableWidth = Math.max(1, selection.width - padding * 2);
      targetContext.font = canvasFont(size);
      const measuredWidth = targetContext.measureText(text).width;
      if (measuredWidth <= availableWidth) break;
      size *= availableWidth / measuredWidth;
    }
    return Math.max(1, size);
  }

  function updateFontSizeUI() {
    const isAuto = elements.autoTextSize.checked;
    elements.fontSize.disabled = isAuto;
    elements.fontSizeValue.value = isAuto
      ? selection
        ? `${Math.round(effectiveFontSize())} px auto`
        : "Auto"
      : `${elements.fontSize.value} px`;
  }

  function getPatternLineColor(hexColor, opacity = 0.24) {
    const hex = hexColor.replace("#", "");
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    return luminance > 0.58 ? `rgba(20, 33, 61, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
  }

  function setPattern(nextPattern, remember = true) {
    pattern = nextPattern;
    elements.patternButtons.forEach((button) => {
      const isActive = button.dataset.patchPattern === pattern;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (remember) savePreference(STORAGE_KEYS.pattern, pattern);
    render();
  }

  function loadRecentPatches() {
    try {
      const saved = JSON.parse(readPreference(STORAGE_KEYS.recentPatches, "[]"));
      const normalizedPatches = Array.isArray(saved)
        ? saved
            .filter((preset) => preset && ["mask", "text"].includes(preset.mode))
            .map((preset) => ({
              mode: preset.mode,
              pattern: ["solid", "diagonal", "hatch"].includes(preset.pattern) ? preset.pattern : "solid",
              backgroundColor: preset.backgroundColor || "#111827",
              text: preset.mode === "text" ? String(preset.text || "").trim() : "",
              textColor: preset.textColor || "#ffffff",
              fontSize: Number(preset.fontSize) || 28,
              autoTextSize: preset.autoTextSize === true,
              textStyle: ["normal", "bold", "italic"].includes(preset.textStyle) ? preset.textStyle : "bold",
            }))
        : [];
      const seen = new Set();
      recentPatches = normalizedPatches
        .filter((preset) => {
          const key = presetKey(preset);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, MAX_RECENT_PATCHES);
      savePreference(STORAGE_KEYS.recentPatches, JSON.stringify(recentPatches));
    } catch {
      recentPatches = [];
    }
    renderRecentPatches();
  }

  function currentPreset() {
    return {
      mode,
      pattern,
      backgroundColor: elements.backgroundColor.value,
      text: mode === "text" ? elements.replacementText.value.trim() : "",
      textColor: elements.textColor.value,
      textStyle,
      fontSize: Number(elements.fontSize.value),
      autoTextSize: elements.autoTextSize.checked,
    };
  }

  function presetKey(preset) {
    if (preset.mode === "mask") {
      return JSON.stringify([preset.mode, preset.pattern, preset.backgroundColor]);
    }
    return JSON.stringify([
      preset.mode,
      preset.pattern,
      preset.backgroundColor,
      preset.text,
      preset.textColor,
      preset.textStyle,
      preset.fontSize,
      preset.autoTextSize,
    ]);
  }

  function rememberPreset(preset) {
    const key = presetKey(preset);
    recentPatches = [preset, ...recentPatches.filter((item) => presetKey(item) !== key)].slice(0, MAX_RECENT_PATCHES);
    savePreference(STORAGE_KEYS.recentPatches, JSON.stringify(recentPatches));
    renderRecentPatches();
  }

  function rememberCurrentPreset() {
    rememberPreset(currentPreset());
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function renderRecentPatches() {
    elements.recentList.querySelectorAll(".recent-preset").forEach((item) => item.remove());
    elements.recentEmpty.hidden = recentPatches.length > 0;
    elements.clearRecentButton.hidden = recentPatches.length === 0;

    recentPatches.forEach((preset, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-preset";
      button.setAttribute("aria-label", `Reuse recent patch ${index + 1}: ${preset.text || `${preset.pattern} mask`}`);

      const swatch = document.createElement("span");
      swatch.className = "recent-swatch";
      swatch.dataset.patchPattern = preset.pattern || "solid";
      swatch.style.setProperty("--sample-color", preset.backgroundColor || "#111827");
      swatch.style.setProperty("--sample-line", getPatternLineColor(preset.backgroundColor || "#111827", 0.32));
      swatch.style.setProperty("--sample-text", preset.textColor || "#ffffff");
      swatch.textContent = preset.mode === "text" ? "Aa" : "";
      if (preset.mode === "text") {
        swatch.style.fontStyle = preset.textStyle === "italic" ? "italic" : "normal";
        swatch.style.fontWeight = preset.textStyle === "bold" ? "700" : "400";
      }
      swatch.setAttribute("aria-hidden", "true");

      const copy = document.createElement("span");
      copy.className = "recent-copy";
      const title = document.createElement("strong");
      title.textContent = preset.mode === "text" ? preset.text || "Text patch" : `${capitalize(preset.pattern || "solid")} mask`;
      const detail = document.createElement("small");
      detail.textContent = preset.mode === "text"
        ? `${preset.autoTextSize ? "Auto" : `${preset.fontSize || 28} px`} · ${capitalize(preset.textStyle || "bold")} · ${capitalize(preset.pattern || "solid")}`
        : `${(preset.backgroundColor || "#111827").toUpperCase()}`;
      copy.append(title, detail);

      const arrow = document.createElement("span");
      arrow.className = "recent-arrow";
      arrow.textContent = "↗";
      arrow.setAttribute("aria-hidden", "true");

      button.append(swatch, copy, arrow);
      button.addEventListener("click", () => reusePreset(preset));
      elements.recentList.append(button);
    });
  }

  function reusePreset(preset) {
    rememberPreset(preset);
    elements.backgroundColor.value = preset.backgroundColor || "#111827";
    elements.textColor.value = preset.textColor || "#ffffff";
    elements.fontSize.value = String(preset.fontSize || 28);
    elements.autoTextSize.checked = preset.autoTextSize === true;
    elements.replacementText.value = preset.text || "";
    savePreference(STORAGE_KEYS.backgroundColor, elements.backgroundColor.value);
    savePreference(STORAGE_KEYS.textColor, elements.textColor.value);
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    savePreference(STORAGE_KEYS.autoTextSize, String(elements.autoTextSize.checked));
    updatePreferenceLabels();
    setTextStyle(preset.textStyle || "bold");
    setPattern(preset.pattern || "solid");
    setMode(preset.mode || "mask");
    if (selection && preset.mode !== "text") canvas.focus({ preventScroll: true });
    showToast(selection ? "Recent patch loaded. Press Enter to place it." : "Recent patch loaded. Draw a box to place it.");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
  }

  function updateImageMeta() {
    if (!imageLoaded) return;
    const source = `${imageLabel} · ${baseCanvas.width} × ${baseCanvas.height} px`;
    if (!frameEnabled) {
      elements.imageMeta.textContent = source;
      return;
    }
    const dimensions = getOutputDimensions();
    elements.imageMeta.textContent = `${source} · output ${dimensions.width} × ${dimensions.height}`;
  }

  function updateFramePreview() {
    if (!imageLoaded) {
      elements.framePreview.hidden = true;
      return;
    }

    elements.framePreview.hidden = false;
    elements.framePreview.classList.toggle("is-framed", frameEnabled);

    if (!frameEnabled) {
      elements.framePreview.classList.remove("shows-transparency");
      elements.framePreview.classList.remove("is-zero-padding");
      elements.framePreview.style.removeProperty("width");
      elements.framePreview.style.removeProperty("height");
      elements.framePreview.style.removeProperty("padding");
      elements.framePreview.style.removeProperty("background");
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
      canvas.style.removeProperty("border-radius");
      updateImageMeta();
      window.requestAnimationFrame(render);
      return;
    }

    const dimensions = getOutputDimensions();
    const availableWidth = Math.max(120, elements.canvasWrap.clientWidth - 48);
    const availableHeight = Math.max(120, elements.canvasWrap.clientHeight - 48);
    const previewScale = Math.min(availableWidth / dimensions.width, availableHeight / dimensions.height);
    const previewWidth = Math.max(80, dimensions.width * previewScale);
    const previewHeight = Math.max(80, dimensions.height * previewScale);
    const paddingRatio = Number(elements.framePadding.value) / 100;
    const horizontalPadding = previewWidth * paddingRatio;
    const verticalPadding = previewHeight * paddingRatio;
    const availableImageWidth = Math.max(1, previewWidth - horizontalPadding * 2);
    const availableImageHeight = Math.max(1, previewHeight - verticalPadding * 2);
    const imageScale = Math.min(availableImageWidth / baseCanvas.width, availableImageHeight / baseCanvas.height);
    const radius = Number(elements.cornerRadius.value) * previewScale;
    const transparentBackground = frameBackgroundIsTransparent();
    const zeroPadding = paddingRatio === 0;

    elements.framePreview.style.width = `${previewWidth}px`;
    elements.framePreview.style.height = `${previewHeight}px`;
    elements.framePreview.style.padding = `${verticalPadding}px ${horizontalPadding}px`;
    elements.framePreview.classList.toggle("shows-transparency", transparentBackground);
    elements.framePreview.classList.toggle("is-zero-padding", zeroPadding);
    if (transparentBackground) elements.framePreview.style.removeProperty("background");
    else elements.framePreview.style.background = gradientCss();
    canvas.style.width = `${baseCanvas.width * imageScale}px`;
    canvas.style.height = `${baseCanvas.height * imageScale}px`;
    canvas.style.borderRadius = `${radius}px`;
    updateImageMeta();
    window.requestAnimationFrame(render);
  }

  function isImageFile(file) {
    return Boolean(file && file.type.startsWith("image/"));
  }

  function chooseFile() {
    elements.fileInput.click();
  }

  function imageDimensionsAreValid(image) {
    const maxDimension = 12000;
    const maxPixels = 48_000_000;
    return (
      image.naturalWidth <= maxDimension &&
      image.naturalHeight <= maxDimension &&
      image.naturalWidth * image.naturalHeight <= maxPixels
    );
  }

  function activateImage(image, { id, label, name }) {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    baseCanvas.width = image.naturalWidth;
    baseCanvas.height = image.naturalHeight;
    baseContext.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseContext.drawImage(image, 0, 0);

    imageLoaded = true;
    currentImageId = id;
    imageLabel = label || "Pasted image";
    imageName = name || "pasted-image";
    if (matchImageRatio) syncOutputToSourceSize();
    selection = null;
    history = [];
    future = [];
    elements.emptyState.hidden = true;
    elements.framePreview.hidden = false;
    canvas.hidden = false;
    canvas.tabIndex = 0;
    elements.editControls.setAttribute("aria-disabled", "false");
    elements.copyButton.disabled = false;
    elements.downloadButton.disabled = false;
    elements.workspaceTip.textContent = "Drag a box · Enter applies";
    updateControls();
    updatePresentationUI();
    render();
    canvas.focus({ preventScroll: true });
  }

  function imageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(blob);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("The saved image could not be opened."));
      };
      image.src = url;
    });
  }

  async function restoreSavedImage(id) {
    if (isSwitchingImages || id === currentImageId) return;
    const record = savedImages.find((item) => item.id === id);
    if (!record) return;

    isSwitchingImages = true;
    renderRecentImages();
    await saveCurrentImage({ notifyFailure: true, refresh: false });

    try {
      const image = await imageFromBlob(record.blob);
      if (!imageDimensionsAreValid(image)) throw new Error("The saved image is too large.");
      activateImage(image, {
        id: record.id,
        label: record.label,
        name: record.name,
      });
      try {
        await storeImageRecord({ ...record, updatedAt: Date.now() });
        await loadSavedImages();
      } catch {
        await loadSavedImages();
      }
      showToast("Saved image reopened. Keep editing where you left off.");
    } catch {
      showToast("That saved image could not be reopened.");
    } finally {
      isSwitchingImages = false;
      renderRecentImages();
    }
  }

  function loadImageFile(file) {
    if (!isImageFile(file)) {
      showToast("Choose a PNG, JPG, WebP, or GIF image.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => showToast("That image could not be read.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => showToast("That image format could not be opened.");
      image.onload = async () => {
        if (!imageDimensionsAreValid(image)) {
          showToast("This image is too large. Use one under 48 megapixels.");
          return;
        }

        await saveCurrentImage({ notifyFailure: true, refresh: false });
        const label = file.name || "Pasted image";
        activateImage(image, {
          id: createImageId(),
          label,
          name: (file.name || "pasted-image").replace(/\.[^.]+$/, ""),
        });
        await saveCurrentImage({ notifyFailure: true });
        showToast("Image ready. Drag a box to start.");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (event.clientX - bounds.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (event.clientY - bounds.top) * scaleY)),
    };
  }

  function normalizeBox(start, end) {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  function drawPatch(targetContext, includeOutline = false) {
    if (!selection) return;

    targetContext.save();
    targetContext.fillStyle = elements.backgroundColor.value;
    targetContext.fillRect(selection.x, selection.y, selection.width, selection.height);
    drawPattern(targetContext);

    if (mode === "text" && elements.replacementText.value.trim()) {
      const fontSize = effectiveFontSize(targetContext);
      const horizontalPadding = Math.max(4, Math.min(fontSize * 0.42, selection.width * 0.08));
      targetContext.beginPath();
      targetContext.rect(selection.x, selection.y, selection.width, selection.height);
      targetContext.clip();
      targetContext.fillStyle = elements.textColor.value;
      targetContext.font = canvasFont(fontSize);
      targetContext.textAlign = "left";
      targetContext.textBaseline = "middle";
      targetContext.fillText(
        elements.replacementText.value.trim(),
        selection.x + horizontalPadding,
        selection.y + selection.height / 2,
      );
    }

    if (includeOutline) {
      const displayScale = canvas.width / Math.max(canvas.getBoundingClientRect().width, 1);
      const lineWidth = Math.max(1, 2 * displayScale);
      const handleSize = Math.max(5, 7 * displayScale);
      targetContext.setLineDash([6 * displayScale, 4 * displayScale]);
      targetContext.lineWidth = lineWidth;
      targetContext.strokeStyle = "#2f6fed";
      targetContext.strokeRect(selection.x, selection.y, selection.width, selection.height);
      targetContext.setLineDash([]);

      const corners = [
        [selection.x, selection.y],
        [selection.x + selection.width, selection.y],
        [selection.x + selection.width, selection.y + selection.height],
        [selection.x, selection.y + selection.height],
      ];
      targetContext.fillStyle = "#2f6fed";
      targetContext.strokeStyle = "#ffffff";
      targetContext.lineWidth = Math.max(1, displayScale);
      corners.forEach(([x, y]) => {
        targetContext.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        targetContext.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
      });
    }
    targetContext.restore();
  }

  function drawPattern(targetContext) {
    if (pattern === "solid" || !selection) return;

    const displayScale = canvas.width / Math.max(canvas.getBoundingClientRect().width, 1);
    const spacing = Math.max(8, Math.round(9 * displayScale));
    const tile = document.createElement("canvas");
    tile.width = spacing * 2;
    tile.height = spacing * 2;
    const tileContext = tile.getContext("2d");
    tileContext.strokeStyle = getPatternLineColor(elements.backgroundColor.value);
    tileContext.lineWidth = Math.max(1, Math.round(1.5 * displayScale));

    const drawDiagonal = (reverse = false) => {
      tileContext.beginPath();
      for (let offset = -tile.width; offset <= tile.width * 2; offset += spacing) {
        if (reverse) {
          tileContext.moveTo(offset, 0);
          tileContext.lineTo(offset - tile.height, tile.height);
        } else {
          tileContext.moveTo(offset, 0);
          tileContext.lineTo(offset + tile.height, tile.height);
        }
      }
      tileContext.stroke();
    };

    drawDiagonal(false);
    if (pattern === "hatch") drawDiagonal(true);
    targetContext.fillStyle = targetContext.createPattern(tile, "repeat");
    targetContext.fillRect(selection.x, selection.y, selection.width, selection.height);
  }

  function render() {
    if (!imageLoaded) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(baseCanvas, 0, 0);
    drawPatch(context, true);
  }

  function updateControls() {
    const hasSelection = Boolean(selection && selection.width >= 2 && selection.height >= 2);
    elements.applyButton.disabled = !imageLoaded || !hasSelection;
    elements.clearSelectionButton.disabled = !hasSelection;
    elements.undoButton.disabled = history.length === 0 || isRestoring;
    elements.redoButton.disabled = future.length === 0 || isRestoring;
    elements.applyButtonLabel.textContent = mode === "mask" ? "Apply mask" : "Place text";
    updateFontSizeUI();

    if (hasSelection) {
      elements.selectionReadout.textContent = `${Math.round(selection.width)} × ${Math.round(selection.height)} px`;
    } else {
      elements.selectionReadout.textContent = imageLoaded ? "Draw a box" : "Add an image first";
    }
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isText = mode === "text";
    elements.maskModeButton.classList.toggle("is-active", !isText);
    elements.maskModeButton.setAttribute("aria-pressed", String(!isText));
    elements.textModeButton.classList.toggle("is-active", isText);
    elements.textModeButton.setAttribute("aria-pressed", String(isText));
    elements.textOptions.hidden = !isText;
    updateControls();
    render();
    if (isText && selection) elements.replacementText.focus({ preventScroll: true });
  }

  function snapshot() {
    return baseCanvas.toDataURL("image/png");
  }

  function restoreSnapshot(imageData) {
    isRestoring = true;
    updateControls();
    const image = new Image();
    image.onload = () => {
      baseContext.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
      baseContext.drawImage(image, 0, 0);
      selection = null;
      isRestoring = false;
      updateControls();
      render();
      scheduleCurrentImageSave();
    };
    image.onerror = () => {
      isRestoring = false;
      updateControls();
      showToast("That history step could not be restored.");
    };
    image.src = imageData;
  }

  function applyPatch() {
    if (!selection || elements.applyButton.disabled) return;
    history.push(snapshot());
    if (history.length > 12) history.shift();
    future = [];
    drawPatch(baseContext, false);
    rememberCurrentPreset();
    selection = null;
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast(mode === "mask" ? "Mask applied." : "Text placed.");
  }

  function undo() {
    if (!history.length || isRestoring) return;
    future.push(snapshot());
    restoreSnapshot(history.pop());
    showToast("Undid last edit.");
  }

  function redo() {
    if (!future.length || isRestoring) return;
    history.push(snapshot());
    restoreSnapshot(future.pop());
    showToast("Redid edit.");
  }

  function clearSelection() {
    selection = null;
    updateControls();
    render();
  }

  function fillGradient(targetContext, width, height) {
    const definition = GRADIENTS[gradientName] || GRADIENTS.dusk;
    const radians = ((definition.angle - 90) * Math.PI) / 180;
    const directionX = Math.cos(radians);
    const directionY = Math.sin(radians);
    const length = Math.abs(width * directionX) + Math.abs(height * directionY);
    const centerX = width / 2;
    const centerY = height / 2;
    const gradient = targetContext.createLinearGradient(
      centerX - (directionX * length) / 2,
      centerY - (directionY * length) / 2,
      centerX + (directionX * length) / 2,
      centerY + (directionY * length) / 2,
    );
    definition.stops.forEach((color, index) => {
      gradient.addColorStop(index / Math.max(1, definition.stops.length - 1), color);
    });
    targetContext.fillStyle = gradient;
    targetContext.fillRect(0, 0, width, height);
  }

  function roundedRectanglePath(targetContext, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    targetContext.beginPath();
    targetContext.moveTo(x + safeRadius, y);
    targetContext.lineTo(x + width - safeRadius, y);
    targetContext.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    targetContext.lineTo(x + width, y + height - safeRadius);
    targetContext.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    targetContext.lineTo(x + safeRadius, y + height);
    targetContext.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    targetContext.lineTo(x, y + safeRadius);
    targetContext.quadraticCurveTo(x, y, x + safeRadius, y);
    targetContext.closePath();
  }

  function createExportCanvas() {
    if (!frameEnabled) return baseCanvas;

    const dimensions = getOutputDimensions();
    const output = document.createElement("canvas");
    output.width = dimensions.width;
    output.height = dimensions.height;
    const outputContext = output.getContext("2d");
    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = "high";
    if (!frameBackgroundIsTransparent()) fillGradient(outputContext, output.width, output.height);

    const paddingRatio = Number(elements.framePadding.value) / 100;
    const horizontalPadding = output.width * paddingRatio;
    const verticalPadding = output.height * paddingRatio;
    const availableWidth = Math.max(1, output.width - horizontalPadding * 2);
    const availableHeight = Math.max(1, output.height - verticalPadding * 2);
    const scale = Math.min(availableWidth / baseCanvas.width, availableHeight / baseCanvas.height);
    const imageWidth = baseCanvas.width * scale;
    const imageHeight = baseCanvas.height * scale;
    const imageX = (output.width - imageWidth) / 2;
    const imageY = (output.height - imageHeight) / 2;
    const radius = Number(elements.cornerRadius.value);
    const shadowUnit = Math.min(output.width, output.height);

    outputContext.save();
    roundedRectanglePath(outputContext, imageX, imageY, imageWidth, imageHeight, radius);
    if (paddingRatio > 0) {
      outputContext.shadowColor = "rgba(15, 23, 42, 0.32)";
      outputContext.shadowBlur = shadowUnit * 0.035;
      outputContext.shadowOffsetY = shadowUnit * 0.018;
    }
    outputContext.fillStyle = "#ffffff";
    outputContext.fill();
    outputContext.restore();

    outputContext.save();
    roundedRectanglePath(outputContext, imageX, imageY, imageWidth, imageHeight, radius);
    outputContext.clip();
    outputContext.drawImage(baseCanvas, imageX, imageY, imageWidth, imageHeight);
    outputContext.restore();
    return output;
  }

  function downloadImage() {
    if (!imageLoaded) return;
    const outputCanvas = createExportCanvas();
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        showToast("The PNG could not be created.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${imageName}-${frameEnabled ? "framed" : "patched"}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("PNG downloaded.");
    }, "image/png");
  }

  async function copyImage() {
    if (!imageLoaded) return;
    if (!navigator.clipboard?.write || typeof window.ClipboardItem === "undefined") {
      showToast("Image copying is not supported here. Use Download PNG.");
      return;
    }

    const outputCanvas = createExportCanvas();
    const pngBlob = new Promise((resolve, reject) => {
      outputCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The PNG could not be created."));
      }, "image/png");
    });

    try {
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": pngBlob })]);
      showToast("Image copied to clipboard.");
    } catch {
      showToast("Could not copy the image. Try Download PNG.");
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    elements.canvasWrap.classList.remove("is-dragging");
    elements.pasteCard.classList.remove("is-dragging");
    const file = [...event.dataTransfer.files].find(isImageFile);
    if (file) loadImageFile(file);
    else showToast("Drop an image file here.");
  }

  [elements.replaceImageButton, elements.pasteCard, elements.emptyState].forEach((button) => {
    button.addEventListener("click", chooseFile);
  });

  elements.fileInput.addEventListener("change", () => {
    if (elements.fileInput.files[0]) loadImageFile(elements.fileInput.files[0]);
    elements.fileInput.value = "";
  });

  document.addEventListener("paste", (event) => {
    const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    event.preventDefault();
    const blob = imageItem.getAsFile();
    if (blob) loadImageFile(blob);
  });

  window.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.canvasWrap.classList.add("is-dragging");
    elements.pasteCard.classList.add("is-dragging");
  });
  window.addEventListener("dragleave", (event) => {
    if (event.relatedTarget) return;
    elements.canvasWrap.classList.remove("is-dragging");
    elements.pasteCard.classList.remove("is-dragging");
  });
  window.addEventListener("drop", handleDrop);

  canvas.addEventListener("pointerdown", (event) => {
    if (!imageLoaded || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    dragStart = canvasPoint(event);
    selection = { x: dragStart.x, y: dragStart.y, width: 0, height: 0 };
    isSelecting = true;
    canvas.classList.add("is-selecting");
    document.body.style.userSelect = "none";
    updateControls();
    render();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!isSelecting) return;
    selection = normalizeBox(dragStart, canvasPoint(event));
    updateControls();
    render();
  });

  function finishSelection(event) {
    if (!isSelecting) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    isSelecting = false;
    canvas.classList.remove("is-selecting");
    document.body.style.userSelect = "";
    if (!selection || selection.width < 2 || selection.height < 2) selection = null;
    updateControls();
    render();
    if (selection && mode === "text") elements.replacementText.focus({ preventScroll: true });
    else if (selection) canvas.focus({ preventScroll: true });
  }

  canvas.addEventListener("pointerup", finishSelection);
  canvas.addEventListener("pointercancel", finishSelection);
  canvas.addEventListener("keydown", (event) => {
    if (!imageLoaded) return;

    if (event.key === "Enter" && selection) {
      event.preventDefault();
      event.stopPropagation();
      applyPatch();
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && !selection) {
      event.preventDefault();
      selection = {
        x: canvas.width * 0.25,
        y: canvas.height * 0.4,
        width: canvas.width * 0.5,
        height: canvas.height * 0.16,
      };
      updateControls();
      render();
      return;
    }

    if (!selection || !event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const step = event.altKey ? 1 : 10;
    const direction = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key];

    if (event.shiftKey) {
      selection.width = Math.max(2, Math.min(canvas.width - selection.x, selection.width + direction[0]));
      selection.height = Math.max(2, Math.min(canvas.height - selection.y, selection.height + direction[1]));
    } else {
      selection.x = Math.max(0, Math.min(canvas.width - selection.width, selection.x + direction[0]));
      selection.y = Math.max(0, Math.min(canvas.height - selection.height, selection.y + direction[1]));
    }
    updateControls();
    render();
  });

  elements.maskModeButton.addEventListener("click", () => setMode("mask"));
  elements.textModeButton.addEventListener("click", () => setMode("text"));
  elements.patternButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPattern(button.dataset.patchPattern);
      if (selection && mode === "text") elements.replacementText.focus({ preventScroll: true });
      else if (selection) canvas.focus({ preventScroll: true });
    });
  });
  elements.applyButton.addEventListener("click", applyPatch);
  elements.clearSelectionButton.addEventListener("click", clearSelection);
  elements.undoButton.addEventListener("click", undo);
  elements.redoButton.addEventListener("click", redo);
  elements.copyButton.addEventListener("click", copyImage);
  elements.downloadButton.addEventListener("click", downloadImage);
  elements.frameEnabled.addEventListener("change", () => {
    frameEnabled = elements.frameEnabled.checked;
    savePreference(STORAGE_KEYS.frameEnabled, String(frameEnabled));
    updatePresentationUI();
    showToast(frameEnabled ? "Share canvas enabled." : "Share canvas removed.");
  });
  elements.ratioButtons.forEach((button) => {
    button.addEventListener("click", () => setAspectPreset(button));
  });
  elements.matchImageRatio.addEventListener("change", () => {
    setMatchImageRatio(elements.matchImageRatio.checked);
  });
  elements.gradientButtons.forEach((button) => {
    button.addEventListener("click", () => setGradient(button.dataset.gradient));
  });
  [elements.outputWidth, elements.outputHeight].forEach((input) => {
    input.addEventListener("input", () => setCustomDimensions(input));
    input.addEventListener("blur", normalizeDimensionInputs);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      normalizeDimensionInputs();
      input.blur();
    });
  });
  elements.framePadding.addEventListener("input", () => {
    savePreference(STORAGE_KEYS.framePadding, elements.framePadding.value);
    updatePresentationUI();
  });
  elements.cornerRadius.addEventListener("input", () => {
    savePreference(STORAGE_KEYS.cornerRadius, elements.cornerRadius.value);
    updatePresentationUI();
  });
  elements.clearRecentButton.addEventListener("click", () => {
    if (!window.confirm("Clear all recent patch presets?")) return;
    recentPatches = [];
    savePreference(STORAGE_KEYS.recentPatches, "[]");
    renderRecentPatches();
    showToast("Recent patches cleared.");
  });
  elements.clearRecentImagesButton.addEventListener("click", async () => {
    if (!window.confirm("Clear saved image history? The image open now will stay open.")) return;
    window.clearTimeout(imageSaveTimer);
    imageSaveTimer = null;
    try {
      await imageSaveQueue;
      await clearImageRecords();
      savedImages = [];
      renderRecentImages();
      showToast("Saved image history cleared.");
    } catch {
      showToast("Saved image history could not be cleared.");
    }
  });

  elements.backgroundColor.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.backgroundColor, elements.backgroundColor.value);
    render();
  });
  elements.textColor.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.textColor, elements.textColor.value);
    render();
  });
  elements.textStyleButtons.forEach((button) => {
    button.addEventListener("click", () => setTextStyle(button.dataset.textStyle));
  });
  elements.fontSize.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    render();
  });
  elements.autoTextSize.addEventListener("change", () => {
    savePreference(STORAGE_KEYS.autoTextSize, String(elements.autoTextSize.checked));
    updateFontSizeUI();
    render();
  });
  elements.replacementText.addEventListener("input", () => {
    updateFontSizeUI();
    render();
  });
  elements.replacementText.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyPatch();
    }
  });

  document.addEventListener("keydown", (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (event.key === "Escape" && selection) {
      clearSelection();
      return;
    }
    if (
      event.key === "Enter" &&
      selection &&
      !event.defaultPrevented &&
      !modifier &&
      !event.target.matches("button, input[type='text']") &&
      !event.target.closest(".presentation-section")
    ) {
      event.preventDefault();
      applyPatch();
      return;
    }
    if (!modifier || event.target.matches("input[type='text']")) return;
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveCurrentImage();
  });

  initializePreferences();
  loadSavedImages();
  updateControls();
  const resizeObserver = new ResizeObserver(() => updateFramePreview());
  resizeObserver.observe(elements.canvasWrap);
})();
