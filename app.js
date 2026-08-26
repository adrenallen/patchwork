(() => {
  const canvas = document.querySelector("#editorCanvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const baseCanvas = document.createElement("canvas");
  const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });
  const sourceCanvas = document.createElement("canvas");
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });

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
    circleModeButton: document.querySelector("#circleModeButton"),
    arrowModeButton: document.querySelector("#arrowModeButton"),
    lineModeButton: document.querySelector("#lineModeButton"),
    patchFillOptions: document.querySelector("#patchFillOptions"),
    textOptions: document.querySelector("#textOptions"),
    annotationOptions: document.querySelector("#annotationOptions"),
    annotationColor: document.querySelector("#annotationColor"),
    annotationColorValue: document.querySelector("#annotationColorValue"),
    annotationSize: document.querySelector("#annotationSize"),
    annotationSizeValue: document.querySelector("#annotationSizeValue"),
    annotationStyleButtons: [...document.querySelectorAll(".annotation-style-button")],
    annotationNote: document.querySelector("#annotationNote"),
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
    cropButton: document.querySelector("#cropButton"),
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
    zoomOutButton: document.querySelector("#zoomOutButton"),
    zoomInButton: document.querySelector("#zoomInButton"),
    zoomValue: document.querySelector("#zoomValue"),
    fitViewButton: document.querySelector("#fitViewButton"),
    panModeButton: document.querySelector("#panModeButton"),
    toast: document.querySelector("#toast"),
  };

  const STORAGE_KEYS = {
    backgroundColor: "patchwork.backgroundColor",
    textColor: "patchwork.textColor",
    textStyle: "patchwork.textStyle",
    fontSize: "patchwork.fontSize",
    autoTextSize: "patchwork.autoTextSize",
    annotationColor: "patchwork.annotationColor",
    annotationSize: "patchwork.annotationSize",
    annotationStyle: "patchwork.annotationStyle",
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
  const MIN_VIEW_ZOOM = 0.5;
  const MAX_VIEW_ZOOM = 4;

  let imageLoaded = false;
  let imageName = "image";
  let imageLabel = "Pasted image";
  let mode = "mask";
  let pattern = "solid";
  let textStyle = "bold";
  let annotationStyle = "clean";
  let frameEnabled = false;
  let aspectPreset = "square";
  let matchImageRatio = true;
  let gradientName = "dusk";
  let selection = null;
  let dragStart = null;
  let arrowStart = null;
  let arrowEnd = null;
  let isSelecting = false;
  let viewZoom = 1;
  let viewPanX = 0;
  let viewPanY = 0;
  let panModeEnabled = false;
  let isPanning = false;
  let panPointerStart = null;
  let panOrigin = null;
  let placedObjects = [];
  let activeObjectId = null;
  let objectInteraction = null;
  let pendingSettingsHistory = null;
  let settingsHistoryTimer = null;
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

  function createObjectId() {
    if (typeof window.crypto?.randomUUID === "function") return window.crypto.randomUUID();
    return `object-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clonePlacedObjects(objects = placedObjects) {
    return objects.map((object) => ({ ...object }));
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
    rebuildBaseCanvas();

    const record = {
      id: currentImageId,
      name: imageName,
      label: imageLabel,
      width: baseCanvas.width,
      height: baseCanvas.height,
      updatedAt: Date.now(),
      objects: clonePlacedObjects(),
    };
    const blobs = Promise.all([canvasBlob(baseCanvas), createThumbnailBlob(), canvasBlob(sourceCanvas)]).then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    const save = async () => {
      try {
        const blobResult = await blobs;
        if (blobResult.error) throw blobResult.error;
        const [blob, thumbnailBlob, sourceBlob] = blobResult.value;
        await storeImageRecord({ ...record, blob, thumbnailBlob, sourceBlob });
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
    elements.annotationColor.value = readPreference(STORAGE_KEYS.annotationColor, "#ef4444");
    elements.annotationSize.value = String(clampNumber(readPreference(STORAGE_KEYS.annotationSize, "6"), 2, 28, 6));
    const savedAnnotationStyle = readPreference(STORAGE_KEYS.annotationStyle, "clean");
    setAnnotationStyle(["clean", "hand"].includes(savedAnnotationStyle) ? savedAnnotationStyle : "clean", false);
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
    elements.annotationColorValue.value = elements.annotationColor.value.toUpperCase();
    elements.annotationSizeValue.value = `${elements.annotationSize.value} px`;
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
    syncActiveObjectFromControls();
    render();
  }

  function setAnnotationStyle(nextStyle, remember = true) {
    annotationStyle = ["clean", "hand"].includes(nextStyle) ? nextStyle : "clean";
    elements.annotationStyleButtons.forEach((button) => {
      const isActive = button.dataset.annotationStyle === annotationStyle;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (remember) savePreference(STORAGE_KEYS.annotationStyle, annotationStyle);
    syncActiveObjectFromControls();
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
    syncActiveObjectFromControls();
    render();
  }

  function loadRecentPatches() {
    try {
      const saved = JSON.parse(readPreference(STORAGE_KEYS.recentPatches, "[]"));
      const normalizedPatches = Array.isArray(saved)
        ? saved
            .filter((preset) => preset && ["mask", "text", "circle", "arrow", "line"].includes(preset.mode))
            .map((preset) => ({
              mode: preset.mode,
              pattern: ["solid", "diagonal", "hatch"].includes(preset.pattern) ? preset.pattern : "solid",
              backgroundColor: preset.backgroundColor || "#111827",
              text: preset.mode === "text" ? String(preset.text || "").trim() : "",
              textColor: preset.textColor || "#ffffff",
              fontSize: Number(preset.fontSize) || 28,
              autoTextSize: preset.autoTextSize === true,
              textStyle: ["normal", "bold", "italic"].includes(preset.textStyle) ? preset.textStyle : "bold",
              annotationColor: preset.annotationColor || "#ef4444",
              annotationSize: clampNumber(preset.annotationSize, 2, 28, 6),
              annotationStyle: ["clean", "hand"].includes(preset.annotationStyle) ? preset.annotationStyle : "clean",
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
      annotationColor: elements.annotationColor.value,
      annotationSize: Number(elements.annotationSize.value),
      annotationStyle,
    };
  }

  function presetKey(preset) {
    if (preset.mode === "mask") {
      return JSON.stringify([preset.mode, preset.pattern, preset.backgroundColor]);
    }
    if (["circle", "arrow", "line"].includes(preset.mode)) {
      return JSON.stringify([preset.mode, preset.annotationColor, preset.annotationSize, preset.annotationStyle]);
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
      const isAnnotation = ["circle", "arrow", "line"].includes(preset.mode);
      const presetName = preset.mode === "text"
        ? preset.text || "Text patch"
        : isAnnotation
          ? capitalize(preset.mode)
          : `${capitalize(preset.pattern || "solid")} mask`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-preset";
      button.setAttribute("aria-label", `Reuse recent tool ${index + 1}: ${presetName}`);

      const swatch = document.createElement("span");
      swatch.className = "recent-swatch";
      swatch.dataset.patchPattern = preset.pattern || "solid";
      swatch.style.setProperty("--sample-color", preset.backgroundColor || "#111827");
      swatch.style.setProperty("--sample-line", getPatternLineColor(preset.backgroundColor || "#111827", 0.32));
      swatch.style.setProperty("--sample-text", preset.textColor || "#ffffff");
      swatch.textContent = preset.mode === "text"
        ? "Aa"
        : isAnnotation
          ? ({ circle: "○", arrow: "↗", line: "╱" }[preset.mode])
          : "";
      if (preset.mode === "text") {
        swatch.style.fontStyle = preset.textStyle === "italic" ? "italic" : "normal";
        swatch.style.fontWeight = preset.textStyle === "bold" ? "700" : "400";
      } else if (isAnnotation) {
        swatch.classList.add("is-annotation");
        swatch.style.setProperty("--annotation-color", preset.annotationColor || "#ef4444");
      }
      swatch.setAttribute("aria-hidden", "true");

      const copy = document.createElement("span");
      copy.className = "recent-copy";
      const title = document.createElement("strong");
      title.textContent = presetName;
      const detail = document.createElement("small");
      detail.textContent = isAnnotation
        ? `${(preset.annotationColor || "#ef4444").toUpperCase()} · ${preset.annotationSize || 6} px · ${preset.annotationStyle === "hand" ? "Hand drawn" : "Clean"}`
        : preset.mode === "text"
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
    commitPendingSettingsHistory();
    activeObjectId = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    rememberPreset(preset);
    elements.backgroundColor.value = preset.backgroundColor || "#111827";
    elements.textColor.value = preset.textColor || "#ffffff";
    elements.fontSize.value = String(preset.fontSize || 28);
    elements.autoTextSize.checked = preset.autoTextSize === true;
    elements.replacementText.value = preset.text || "";
    elements.annotationColor.value = preset.annotationColor || "#ef4444";
    elements.annotationSize.value = String(preset.annotationSize || 6);
    savePreference(STORAGE_KEYS.backgroundColor, elements.backgroundColor.value);
    savePreference(STORAGE_KEYS.textColor, elements.textColor.value);
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    savePreference(STORAGE_KEYS.autoTextSize, String(elements.autoTextSize.checked));
    savePreference(STORAGE_KEYS.annotationColor, elements.annotationColor.value);
    savePreference(STORAGE_KEYS.annotationSize, elements.annotationSize.value);
    updatePreferenceLabels();
    setTextStyle(preset.textStyle || "bold");
    setPattern(preset.pattern || "solid");
    setAnnotationStyle(preset.annotationStyle || "clean");
    setMode(preset.mode || "mask");
    if (selection && preset.mode !== "text") canvas.focus({ preventScroll: true });
    showToast(selection ? "Recent tool loaded. Press Enter to place it." : "Recent tool loaded. Drag to place it.");
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

  function updateViewTransform() {
    elements.framePreview.style.transform = `translate3d(${viewPanX}px, ${viewPanY}px, 0) scale(${viewZoom})`;
    elements.zoomValue.value = `${Math.round(viewZoom * 100)}%`;
    elements.zoomOutButton.disabled = !imageLoaded || viewZoom <= MIN_VIEW_ZOOM;
    elements.zoomInButton.disabled = !imageLoaded || viewZoom >= MAX_VIEW_ZOOM;
    elements.fitViewButton.disabled = !imageLoaded;
    elements.panModeButton.disabled = !imageLoaded;
    elements.panModeButton.classList.toggle("is-active", panModeEnabled && imageLoaded);
    elements.panModeButton.setAttribute("aria-pressed", String(panModeEnabled && imageLoaded));
    elements.canvasWrap.classList.toggle("is-pan-mode", panModeEnabled && imageLoaded);
  }

  function setViewZoom(nextZoom) {
    if (!imageLoaded) return;
    viewZoom = Math.max(MIN_VIEW_ZOOM, Math.min(MAX_VIEW_ZOOM, Math.round(nextZoom * 20) / 20));
    updateViewTransform();
  }

  function fitView({ notify = true } = {}) {
    viewZoom = 1;
    viewPanX = 0;
    viewPanY = 0;
    updateViewTransform();
    if (notify && imageLoaded) showToast("View fitted to the workspace.");
  }

  function setPanMode(enabled) {
    panModeEnabled = Boolean(enabled && imageLoaded);
    updateViewTransform();
    if (imageLoaded) showToast(panModeEnabled ? "Pan on. Drag the image to move it." : "Pan off. Drag to use the selected tool.");
  }

  function updateFramePreview() {
    if (!imageLoaded) {
      elements.framePreview.hidden = true;
      updateViewTransform();
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
      updateViewTransform();
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
    updateViewTransform();
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

  function activateImage(image, { id, label, name, objects = [] }) {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    sourceCanvas.width = image.naturalWidth;
    sourceCanvas.height = image.naturalHeight;
    sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    sourceContext.drawImage(image, 0, 0);
    baseCanvas.width = image.naturalWidth;
    baseCanvas.height = image.naturalHeight;
    placedObjects = clonePlacedObjects(objects);
    activeObjectId = null;
    rebuildBaseCanvas();

    imageLoaded = true;
    currentImageId = id;
    imageLabel = label || "Pasted image";
    imageName = name || "pasted-image";
    if (matchImageRatio) syncOutputToSourceSize();
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    history = [];
    future = [];
    panModeEnabled = false;
    viewZoom = 1;
    viewPanX = 0;
    viewPanY = 0;
    elements.emptyState.hidden = true;
    elements.framePreview.hidden = false;
    canvas.hidden = false;
    canvas.tabIndex = 0;
    elements.editControls.setAttribute("aria-disabled", "false");
    elements.copyButton.disabled = false;
    elements.downloadButton.disabled = false;
    elements.workspaceTip.textContent = "Drag to mark · click an item to edit";
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
      const hasEditableDocument = Boolean(record.sourceBlob && Array.isArray(record.objects));
      const image = await imageFromBlob(hasEditableDocument ? record.sourceBlob : record.blob);
      if (!imageDimensionsAreValid(image)) throw new Error("The saved image is too large.");
      activateImage(image, {
        id: record.id,
        label: record.label,
        name: record.name,
        objects: hasEditableDocument ? record.objects : [],
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

  function viewHitTolerance() {
    return Math.max(4, 10 * canvas.width / Math.max(canvas.getBoundingClientRect().width, 1));
  }

  function distanceBetween(left, right) {
    return Math.hypot(right.x - left.x, right.y - left.y);
  }

  function distanceToSegment(point, start, end) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    if (!lengthSquared) return distanceBetween(point, start);
    const progress = Math.max(0, Math.min(1, ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) / lengthSquared));
    return distanceBetween(point, { x: start.x + progress * deltaX, y: start.y + progress * deltaY });
  }

  function curveDistance(point, object) {
    const start = { x: object.startX, y: object.startY };
    const control = { x: object.controlX, y: object.controlY };
    const end = { x: object.endX, y: object.endY };
    let nearest = Number.POSITIVE_INFINITY;
    let previous = start;
    for (let step = 1; step <= 28; step += 1) {
      const current = quadraticPoint(start, control, end, step / 28);
      nearest = Math.min(nearest, distanceToSegment(point, previous, current));
      previous = current;
    }
    return nearest;
  }

  function objectContainsPoint(object, point) {
    if (["arrow", "line"].includes(object.mode)) {
      return curveDistance(point, object) <= viewHitTolerance() + object.annotationSize / 2;
    }
    const bounds = objectBounds(object);
    return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
  }

  function findObjectAtPoint(point) {
    for (let index = placedObjects.length - 1; index >= 0; index -= 1) {
      if (objectContainsPoint(placedObjects[index], point)) return placedObjects[index];
    }
    return null;
  }

  function activeHandleAtPoint(point) {
    const object = activeObject();
    if (!object) return null;
    const tolerance = viewHitTolerance();
    if (["arrow", "line"].includes(object.mode)) {
      const handles = [
        ["start", { x: object.startX, y: object.startY }],
        ["end", { x: object.endX, y: object.endY }],
        ["control", { x: object.controlX, y: object.controlY }],
      ];
      return handles.find(([, handlePoint]) => distanceBetween(point, handlePoint) <= tolerance)?.[0] || null;
    }
    const bounds = objectBounds(object);
    const handles = [
      ["nw", { x: bounds.x, y: bounds.y }],
      ["ne", { x: bounds.x + bounds.width, y: bounds.y }],
      ["se", { x: bounds.x + bounds.width, y: bounds.y + bounds.height }],
      ["sw", { x: bounds.x, y: bounds.y + bounds.height }],
    ];
    return handles.find(([, handlePoint]) => distanceBetween(point, handlePoint) <= tolerance)?.[0] || null;
  }

  function translatedObject(original, deltaX, deltaY) {
    const translated = { ...original };
    if (["arrow", "line"].includes(translated.mode)) {
      translated.startX += deltaX;
      translated.startY += deltaY;
      translated.endX += deltaX;
      translated.endY += deltaY;
      translated.controlX += deltaX;
      translated.controlY += deltaY;
    } else {
      translated.x += deltaX;
      translated.y += deltaY;
    }
    return translated;
  }

  function beginObjectInteraction(object, point, handle = null) {
    commitPendingSettingsHistory();
    objectInteraction = {
      objectId: object.id,
      kind: handle ? "resize" : "move",
      handle,
      startPoint: { ...point },
      original: { ...object },
      beforeSnapshot: null,
      changed: false,
    };
  }

  function boxForResize(original, handle, point) {
    const opposite = {
      nw: { x: original.x + original.width, y: original.y + original.height },
      ne: { x: original.x, y: original.y + original.height },
      se: { x: original.x, y: original.y },
      sw: { x: original.x + original.width, y: original.y },
    }[handle];
    const constrained = {
      x: Math.max(0, Math.min(canvas.width, point.x)),
      y: Math.max(0, Math.min(canvas.height, point.y)),
    };
    const box = normalizeBox(opposite, constrained);
    if (box.width < 4) {
      box.x = handle.includes("w") ? opposite.x - 4 : opposite.x;
      box.width = 4;
    }
    if (box.height < 4) {
      box.y = handle.includes("n") ? opposite.y - 4 : opposite.y;
      box.height = 4;
    }
    return box;
  }

  function updateObjectInteraction(point) {
    if (!objectInteraction) return;
    const index = placedObjects.findIndex((object) => object.id === objectInteraction.objectId);
    if (index < 0) return;
    const original = objectInteraction.original;
    let updated = { ...original };

    if (objectInteraction.kind === "move") {
      const bounds = objectBounds(original);
      const requestedX = point.x - objectInteraction.startPoint.x;
      const requestedY = point.y - objectInteraction.startPoint.y;
      const deltaX = Math.max(-bounds.x, Math.min(canvas.width - bounds.x - bounds.width, requestedX));
      const deltaY = Math.max(-bounds.y, Math.min(canvas.height - bounds.y - bounds.height, requestedY));
      updated = translatedObject(original, deltaX, deltaY);
    } else if (["arrow", "line"].includes(original.mode)) {
      const clampedPoint = {
        x: Math.max(0, Math.min(canvas.width, point.x)),
        y: Math.max(0, Math.min(canvas.height, point.y)),
      };
      if (objectInteraction.handle === "start") {
        updated.startX = clampedPoint.x;
        updated.startY = clampedPoint.y;
      } else if (objectInteraction.handle === "end") {
        updated.endX = clampedPoint.x;
        updated.endY = clampedPoint.y;
      } else {
        updated.controlX = clampedPoint.x;
        updated.controlY = clampedPoint.y;
      }
    } else {
      Object.assign(updated, boxForResize(original, objectInteraction.handle, point));
    }

    const changed = JSON.stringify(updated) !== JSON.stringify(original);
    if (changed && !objectInteraction.beforeSnapshot) objectInteraction.beforeSnapshot = snapshot();
    objectInteraction.changed = changed;
    placedObjects[index] = updated;
    syncSelectionFromActiveObject();
    updateControls();
    render();
  }

  function finishObjectInteraction() {
    if (!objectInteraction) return;
    if (objectInteraction.changed && objectInteraction.beforeSnapshot) {
      history.push(objectInteraction.beforeSnapshot);
      if (history.length > 12) history.shift();
      future = [];
      rebuildBaseCanvas();
      scheduleCurrentImageSave();
    }
    objectInteraction = null;
    updateControls();
    render();
  }

  function drawSelectionOutline(targetContext) {
    if (!selection) return;
    const displayScale = canvas.width / Math.max(canvas.getBoundingClientRect().width, 1);
    const lineWidth = Math.max(1, 2 * displayScale);
    const handleSize = Math.max(5, 7 * displayScale);

    targetContext.save();
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
    targetContext.restore();
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

    targetContext.restore();
    if (includeOutline) drawSelectionOutline(targetContext);
  }

  function markerSize() {
    return Math.max(2, Number(elements.annotationSize.value) || 6);
  }

  function prepareMarkerContext(targetContext, size, color = elements.annotationColor.value) {
    targetContext.strokeStyle = color;
    targetContext.fillStyle = color;
    targetContext.lineWidth = size;
    targetContext.lineCap = "round";
    targetContext.lineJoin = "round";
    targetContext.shadowColor = "rgba(15, 23, 42, 0.2)";
    targetContext.shadowBlur = Math.max(1, size * 0.65);
    targetContext.shadowOffsetY = Math.max(1, size * 0.22);
  }

  function drawStyledCircle(targetContext, box, { color, size, style }) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const radiusX = Math.max(0.5, box.width / 2 - size / 2);
    const radiusY = Math.max(0.5, box.height / 2 - size / 2);

    targetContext.save();
    prepareMarkerContext(targetContext, size, color);
    targetContext.beginPath();
    targetContext.ellipse(centerX, centerY, radiusX, radiusY, style === "hand" ? -0.025 : 0, 0, Math.PI * 2);
    targetContext.stroke();

    if (style === "hand") {
      targetContext.shadowColor = "transparent";
      targetContext.globalAlpha = 0.52;
      targetContext.lineWidth = Math.max(1, size * 0.48);
      targetContext.beginPath();
      targetContext.ellipse(centerX + size * 0.28, centerY - size * 0.18, radiusX * 0.995, radiusY * 1.01, 0.018, Math.PI * 0.08, Math.PI * 1.92);
      targetContext.stroke();
      targetContext.globalAlpha = 0.26;
      targetContext.beginPath();
      targetContext.ellipse(centerX - size * 0.16, centerY + size * 0.12, radiusX * 1.008, radiusY * 0.992, -0.01, Math.PI * 0.72, Math.PI * 1.55);
      targetContext.stroke();
    }
    targetContext.restore();
  }

  function drawMarkerCircle(targetContext) {
    drawStyledCircle(targetContext, selection, {
      color: elements.annotationColor.value,
      size: markerSize(),
      style: annotationStyle,
    });
  }

  function resolvedArrowPoints() {
    return {
      start: arrowStart || { x: selection.x, y: selection.y },
      end: arrowEnd || { x: selection.x + selection.width, y: selection.y + selection.height },
    };
  }

  function arrowLength() {
    if (!selection) return 0;
    const { start, end } = resolvedArrowPoints();
    return Math.hypot(end.x - start.x, end.y - start.y);
  }

  function midpoint(start, end) {
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  }

  function drawStyledCurve(targetContext, { start, end, control, color, size, style, arrowHead }) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.hypot(deltaX, deltaY);
    if (length < 1) return;

    const tangentX = end.x - control.x || deltaX;
    const tangentY = end.y - control.y || deltaY;
    const tangentLength = Math.hypot(tangentX, tangentY) || length;
    const directionX = tangentX / tangentLength;
    const directionY = tangentY / tangentLength;
    const normalX = -directionY;
    const normalY = directionX;

    targetContext.save();
    prepareMarkerContext(targetContext, size, color);
    targetContext.beginPath();
    targetContext.moveTo(start.x, start.y);
    targetContext.quadraticCurveTo(control.x, control.y, end.x, end.y);
    targetContext.stroke();

    if (style === "hand") {
      const chordNormalX = -deltaY / length;
      const chordNormalY = deltaX / length;
      const wobble = Math.max(0.7, size * 0.22);
      targetContext.shadowColor = "transparent";
      targetContext.globalAlpha = 0.46;
      targetContext.lineWidth = Math.max(1, size * 0.5);
      targetContext.beginPath();
      targetContext.moveTo(start.x + chordNormalX * wobble, start.y + chordNormalY * wobble);
      targetContext.quadraticCurveTo(
        control.x - chordNormalX * wobble * 1.6,
        control.y - chordNormalY * wobble * 1.6,
        end.x - chordNormalX * wobble * 0.4,
        end.y - chordNormalY * wobble * 0.4,
      );
      targetContext.stroke();
    }

    if (arrowHead) {
      const headLength = Math.min(length * 0.38, Math.max(size * 4.2, 16));
      const headWidth = Math.min(length * 0.34, Math.max(size * 2.8, 12));
      const baseX = end.x - directionX * headLength;
      const baseY = end.y - directionY * headLength;
      targetContext.shadowColor = "rgba(15, 23, 42, 0.16)";
      targetContext.globalAlpha = 1;
      if (style === "hand") {
        targetContext.lineWidth = size;
        targetContext.beginPath();
        targetContext.moveTo(baseX + normalX * headWidth / 2, baseY + normalY * headWidth / 2);
        targetContext.lineTo(end.x, end.y);
        targetContext.lineTo(baseX - normalX * headWidth / 2, baseY - normalY * headWidth / 2);
        targetContext.stroke();
      } else {
        targetContext.beginPath();
        targetContext.moveTo(end.x, end.y);
        targetContext.lineTo(baseX + normalX * headWidth / 2, baseY + normalY * headWidth / 2);
        targetContext.lineTo(baseX - normalX * headWidth / 2, baseY - normalY * headWidth / 2);
        targetContext.closePath();
        targetContext.fill();
      }
    }
    targetContext.restore();
  }

  function drawMarkerArrow(targetContext) {
    const { start, end } = resolvedArrowPoints();
    drawStyledCurve(targetContext, {
      start,
      end,
      control: midpoint(start, end),
      color: elements.annotationColor.value,
      size: markerSize(),
      style: annotationStyle,
      arrowHead: true,
    });
  }

  function drawMarkerLine(targetContext) {
    const { start, end } = resolvedArrowPoints();
    drawStyledCurve(targetContext, {
      start,
      end,
      control: midpoint(start, end),
      color: elements.annotationColor.value,
      size: markerSize(),
      style: annotationStyle,
      arrowHead: false,
    });
  }

  function drawAnnotation(targetContext, includeOutline = false) {
    if (!selection) return;
    if (mode === "circle") drawMarkerCircle(targetContext);
    else if (mode === "arrow") drawMarkerArrow(targetContext);
    else drawMarkerLine(targetContext);
    if (includeOutline) drawSelectionOutline(targetContext);
  }

  function drawCurrentTool(targetContext, includeOutline = false) {
    if (["circle", "arrow", "line"].includes(mode)) drawAnnotation(targetContext, includeOutline);
    else drawPatch(targetContext, includeOutline);
  }

  function drawPattern(targetContext) {
    if (pattern === "solid" || !selection) return;

    const displayScale = (canvas.width / Math.max(canvas.getBoundingClientRect().width, 1)) * viewZoom;
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

  function activeObject() {
    return placedObjects.find((object) => object.id === activeObjectId) || null;
  }

  function objectBounds(object) {
    if (!["arrow", "line"].includes(object.mode)) {
      return { x: object.x, y: object.y, width: object.width, height: object.height };
    }
    const minimumX = Math.min(object.startX, object.endX, object.controlX);
    const minimumY = Math.min(object.startY, object.endY, object.controlY);
    const maximumX = Math.max(object.startX, object.endX, object.controlX);
    const maximumY = Math.max(object.startY, object.endY, object.controlY);
    return { x: minimumX, y: minimumY, width: maximumX - minimumX, height: maximumY - minimumY };
  }

  function syncSelectionFromActiveObject() {
    const object = activeObject();
    if (!object) return;
    selection = objectBounds(object);
    if (["arrow", "line"].includes(object.mode)) {
      arrowStart = { x: object.startX, y: object.startY };
      arrowEnd = { x: object.endX, y: object.endY };
    } else {
      arrowStart = null;
      arrowEnd = null;
    }
  }

  function drawObjectPattern(targetContext, object) {
    if (object.pattern === "solid") return;
    const spacing = Math.max(8, object.patternSpacing || 12);
    const tile = document.createElement("canvas");
    tile.width = spacing * 2;
    tile.height = spacing * 2;
    const tileContext = tile.getContext("2d");
    tileContext.strokeStyle = getPatternLineColor(object.backgroundColor, 0.24);
    tileContext.lineWidth = Math.max(1, object.patternLineWidth || 2);
    const drawDiagonal = (reverse = false) => {
      tileContext.beginPath();
      for (let offset = -tile.width; offset <= tile.width * 2; offset += spacing) {
        tileContext.moveTo(offset, 0);
        tileContext.lineTo(reverse ? offset - tile.height : offset + tile.height, tile.height);
      }
      tileContext.stroke();
    };
    drawDiagonal(false);
    if (object.pattern === "hatch") drawDiagonal(true);
    targetContext.fillStyle = targetContext.createPattern(tile, "repeat");
    targetContext.fillRect(object.x, object.y, object.width, object.height);
  }

  function objectFont(object, size) {
    const weight = object.textStyle === "bold" ? 700 : 400;
    const italic = object.textStyle === "italic" ? "italic " : "";
    return `${italic}${weight} ${size}px ${fontFamily()}`;
  }

  function objectFontSize(targetContext, object) {
    if (!object.autoTextSize) return object.fontSize;
    let size = Math.max(1, object.height * 0.62);
    if (!object.text) return size;
    for (let pass = 0; pass < 2; pass += 1) {
      const padding = Math.max(4, Math.min(size * 0.42, object.width * 0.08));
      const availableWidth = Math.max(1, object.width - padding * 2);
      targetContext.font = objectFont(object, size);
      const measuredWidth = targetContext.measureText(object.text).width;
      if (measuredWidth <= availableWidth) break;
      size *= availableWidth / measuredWidth;
    }
    return Math.max(1, size);
  }

  function drawPlacedObject(targetContext, object) {
    if (["mask", "text"].includes(object.mode)) {
      targetContext.save();
      targetContext.fillStyle = object.backgroundColor;
      targetContext.fillRect(object.x, object.y, object.width, object.height);
      drawObjectPattern(targetContext, object);
      if (object.mode === "text" && object.text) {
        const size = objectFontSize(targetContext, object);
        const padding = Math.max(4, Math.min(size * 0.42, object.width * 0.08));
        targetContext.beginPath();
        targetContext.rect(object.x, object.y, object.width, object.height);
        targetContext.clip();
        targetContext.fillStyle = object.textColor;
        targetContext.font = objectFont(object, size);
        targetContext.textAlign = "left";
        targetContext.textBaseline = "middle";
        targetContext.fillText(object.text, object.x + padding, object.y + object.height / 2);
      }
      targetContext.restore();
      return;
    }

    if (object.mode === "circle") {
      drawStyledCircle(targetContext, object, {
        color: object.annotationColor,
        size: object.annotationSize,
        style: object.annotationStyle || "clean",
      });
      return;
    }

    drawStyledCurve(targetContext, {
      start: { x: object.startX, y: object.startY },
      end: { x: object.endX, y: object.endY },
      control: { x: object.controlX, y: object.controlY },
      color: object.annotationColor,
      size: object.annotationSize,
      style: object.annotationStyle || "clean",
      arrowHead: object.mode === "arrow",
    });
  }

  function rebuildBaseCanvas() {
    if (!sourceCanvas.width || !sourceCanvas.height) return;
    if (baseCanvas.width !== sourceCanvas.width) baseCanvas.width = sourceCanvas.width;
    if (baseCanvas.height !== sourceCanvas.height) baseCanvas.height = sourceCanvas.height;
    baseContext.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseContext.drawImage(sourceCanvas, 0, 0);
    placedObjects.forEach((object) => drawPlacedObject(baseContext, object));
  }

  function quadraticPoint(start, control, end, progress) {
    const inverse = 1 - progress;
    return {
      x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
      y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
    };
  }

  function drawObjectSelection(targetContext, object) {
    if (!["arrow", "line"].includes(object.mode)) {
      drawSelectionOutline(targetContext);
      return;
    }

    const displayScale = canvas.width / Math.max(canvas.getBoundingClientRect().width, 1);
    const handleSize = Math.max(6, 8 * displayScale);
    const start = { x: object.startX, y: object.startY };
    const end = { x: object.endX, y: object.endY };
    const control = { x: object.controlX, y: object.controlY };
    const curveMiddle = quadraticPoint(start, control, end, 0.5);
    targetContext.save();
    targetContext.strokeStyle = "rgba(47, 111, 237, 0.72)";
    targetContext.lineWidth = Math.max(1, displayScale);
    targetContext.setLineDash([4 * displayScale, 4 * displayScale]);
    targetContext.beginPath();
    targetContext.moveTo(curveMiddle.x, curveMiddle.y);
    targetContext.lineTo(control.x, control.y);
    targetContext.stroke();
    targetContext.setLineDash([]);
    targetContext.fillStyle = "#2f6fed";
    targetContext.strokeStyle = "white";
    [start, end].forEach((point) => {
      targetContext.fillRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
      targetContext.strokeRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
    });
    targetContext.translate(control.x, control.y);
    targetContext.rotate(Math.PI / 4);
    targetContext.fillRect(-handleSize * 0.46, -handleSize * 0.46, handleSize * 0.92, handleSize * 0.92);
    targetContext.strokeRect(-handleSize * 0.46, -handleSize * 0.46, handleSize * 0.92, handleSize * 0.92);
    targetContext.restore();
  }

  function render() {
    if (!imageLoaded) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sourceCanvas, 0, 0);
    placedObjects.forEach((object) => drawPlacedObject(context, object));
    const selectedObject = activeObject();
    if (selectedObject) drawObjectSelection(context, selectedObject);
    else drawCurrentTool(context, true);
  }

  function updateControls() {
    const selectedObject = activeObject();
    const hasAreaSelection = Boolean(selection && selection.width >= 2 && selection.height >= 2);
    const hasToolSelection = ["arrow", "line"].includes(mode) ? arrowLength() >= 2 : hasAreaSelection;
    elements.applyButton.disabled = !imageLoaded || !hasToolSelection || Boolean(selectedObject);
    elements.cropButton.disabled = !imageLoaded || !hasAreaSelection;
    elements.clearSelectionButton.disabled = !selection;
    elements.undoButton.disabled = history.length === 0 || isRestoring;
    elements.redoButton.disabled = future.length === 0 || isRestoring;
    elements.applyButtonLabel.textContent = selectedObject ? "Selected item" : {
      mask: "Apply mask",
      text: "Place text",
      circle: "Place circle",
      arrow: "Place arrow",
      line: "Place line",
    }[mode];
    updateFontSizeUI();

    if (hasToolSelection) {
      elements.selectionReadout.textContent = ["arrow", "line"].includes(mode)
        ? `${Math.round(arrowLength())} px ${mode}`
        : `${Math.round(selection.width)} × ${Math.round(selection.height)} px`;
    } else {
      elements.selectionReadout.textContent = imageLoaded
        ? (["arrow", "line"].includes(mode) ? `Drag a ${mode}` : "Draw a box")
        : "Add an image first";
    }
  }

  function setMode(nextMode, { preserveActive = false } = {}) {
    if (panModeEnabled) {
      panModeEnabled = false;
      updateViewTransform();
    }
    if (!preserveActive && activeObjectId) {
      commitPendingSettingsHistory();
      activeObjectId = null;
      selection = null;
      arrowStart = null;
      arrowEnd = null;
    }
    mode = ["mask", "text", "circle", "arrow", "line"].includes(nextMode) ? nextMode : "mask";
    const isText = mode === "text";
    const isAnnotation = ["circle", "arrow", "line"].includes(mode);
    [
      [elements.maskModeButton, "mask"],
      [elements.textModeButton, "text"],
      [elements.circleModeButton, "circle"],
      [elements.arrowModeButton, "arrow"],
      [elements.lineModeButton, "line"],
    ].forEach(([button, buttonMode]) => {
      const isActive = mode === buttonMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    elements.patchFillOptions.hidden = isAnnotation;
    elements.textOptions.hidden = !isText;
    elements.annotationOptions.hidden = !isAnnotation;
    elements.annotationNote.textContent = ["arrow", "line"].includes(mode)
      ? `Drag the ${mode}, then move the diamond handle to bend it.`
      : "Drag a box around the area to circle.";
    if (["arrow", "line"].includes(mode) && selection && (!arrowStart || !arrowEnd)) {
      arrowStart = { x: selection.x, y: selection.y };
      arrowEnd = { x: selection.x + selection.width, y: selection.y + selection.height };
    }
    updateControls();
    render();
    if (isText && selection) elements.replacementText.focus({ preventScroll: true });
  }

  function selectPlacedObject(object) {
    commitPendingSettingsHistory();
    activeObjectId = object.id;
    syncSelectionFromActiveObject();
    setMode(object.mode, { preserveActive: true });
    elements.backgroundColor.value = object.backgroundColor || "#111827";
    elements.textColor.value = object.textColor || "#ffffff";
    elements.fontSize.value = String(object.fontSize || 28);
    elements.autoTextSize.checked = object.autoTextSize === true;
    elements.replacementText.value = object.text || "";
    elements.annotationColor.value = object.annotationColor || "#ef4444";
    elements.annotationSize.value = String(object.annotationSize || 6);
    textStyle = ["normal", "bold", "italic"].includes(object.textStyle) ? object.textStyle : "bold";
    elements.textStyleButtons.forEach((button) => {
      const isActive = button.dataset.textStyle === textStyle;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    pattern = ["solid", "diagonal", "hatch"].includes(object.pattern) ? object.pattern : "solid";
    elements.patternButtons.forEach((button) => {
      const isActive = button.dataset.patchPattern === pattern;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    annotationStyle = ["clean", "hand"].includes(object.annotationStyle) ? object.annotationStyle : "clean";
    elements.annotationStyleButtons.forEach((button) => {
      const isActive = button.dataset.annotationStyle === annotationStyle;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    updatePreferenceLabels();
    updateControls();
    render();
  }

  function commitPendingSettingsHistory() {
    window.clearTimeout(settingsHistoryTimer);
    settingsHistoryTimer = null;
    if (!pendingSettingsHistory) return;
    history.push(pendingSettingsHistory);
    if (history.length > 12) history.shift();
    future = [];
    pendingSettingsHistory = null;
    updateControls();
  }

  function syncActiveObjectFromControls() {
    const object = activeObject();
    if (!object) return;
    if (!pendingSettingsHistory) pendingSettingsHistory = snapshot();
    object.pattern = pattern;
    object.backgroundColor = elements.backgroundColor.value;
    object.text = object.mode === "text" ? elements.replacementText.value.trim() : object.text;
    object.textColor = elements.textColor.value;
    object.textStyle = textStyle;
    object.fontSize = Number(elements.fontSize.value);
    object.autoTextSize = elements.autoTextSize.checked;
    object.annotationColor = elements.annotationColor.value;
    object.annotationSize = markerSize();
    object.annotationStyle = annotationStyle;
    rebuildBaseCanvas();
    render();
    scheduleCurrentImageSave();
    window.clearTimeout(settingsHistoryTimer);
    settingsHistoryTimer = window.setTimeout(commitPendingSettingsHistory, 450);
  }

  function snapshot() {
    return {
      sourceData: sourceCanvas.toDataURL("image/png"),
      objects: clonePlacedObjects(),
    };
  }

  function restoreSnapshot(documentSnapshot) {
    isRestoring = true;
    activeObjectId = null;
    updateControls();
    const image = new Image();
    image.onload = () => {
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      sourceContext.drawImage(image, 0, 0);
      baseCanvas.width = image.naturalWidth;
      baseCanvas.height = image.naturalHeight;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      placedObjects = clonePlacedObjects(documentSnapshot.objects || []);
      rebuildBaseCanvas();
      selection = null;
      arrowStart = null;
      arrowEnd = null;
      if (matchImageRatio) syncOutputToSourceSize();
      fitView({ notify: false });
      isRestoring = false;
      updatePresentationUI();
      updateControls();
      render();
      scheduleCurrentImageSave();
    };
    image.onerror = () => {
      isRestoring = false;
      updateControls();
      showToast("That history step could not be restored.");
    };
    image.src = documentSnapshot.sourceData;
  }

  function rememberHistoryStep() {
    commitPendingSettingsHistory();
    history.push(snapshot());
    if (history.length > 12) history.shift();
    future = [];
  }

  function createPlacedObject() {
    const common = {
      id: createObjectId(),
      mode,
      pattern,
      backgroundColor: elements.backgroundColor.value,
      text: mode === "text" ? elements.replacementText.value.trim() : "",
      textColor: elements.textColor.value,
      textStyle,
      fontSize: Number(elements.fontSize.value),
      autoTextSize: elements.autoTextSize.checked,
      annotationColor: elements.annotationColor.value,
      annotationSize: markerSize(),
      annotationStyle,
    };
    if (["arrow", "line"].includes(mode)) {
      const { start, end } = resolvedArrowPoints();
      const control = midpoint(start, end);
      return {
        ...common,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        controlX: control.x,
        controlY: control.y,
      };
    }
    const displayScale = (canvas.width / Math.max(canvas.getBoundingClientRect().width, 1)) * viewZoom;
    return {
      ...common,
      x: selection.x,
      y: selection.y,
      width: selection.width,
      height: selection.height,
      patternSpacing: Math.max(8, Math.round(9 * displayScale)),
      patternLineWidth: Math.max(1, Math.round(1.5 * displayScale)),
    };
  }

  function applyCurrentTool() {
    if (!selection || elements.applyButton.disabled) return;
    rememberHistoryStep();
    const object = createPlacedObject();
    placedObjects.push(object);
    activeObjectId = object.id;
    syncSelectionFromActiveObject();
    rebuildBaseCanvas();
    rememberCurrentPreset();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast({
      mask: "Mask applied.",
      text: "Text placed.",
      circle: "Circle placed.",
      arrow: "Arrow placed.",
      line: "Line placed.",
    }[mode]);
  }

  function cropToSelection() {
    if (!selection || elements.cropButton.disabled) return;
    const left = Math.max(0, Math.floor(selection.x));
    const top = Math.max(0, Math.floor(selection.y));
    const right = Math.min(baseCanvas.width, Math.ceil(selection.x + selection.width));
    const bottom = Math.min(baseCanvas.height, Math.ceil(selection.y + selection.height));
    const width = right - left;
    const height = bottom - top;
    if (width < 2 || height < 2) return;
    if (left === 0 && top === 0 && width === baseCanvas.width && height === baseCanvas.height) {
      showToast("That selection already covers the full image.");
      return;
    }

    rememberHistoryStep();
    const cropped = document.createElement("canvas");
    cropped.width = width;
    cropped.height = height;
    cropped.getContext("2d").drawImage(sourceCanvas, left, top, width, height, 0, 0, width, height);
    placedObjects = placedObjects
      .filter((object) => {
        const bounds = objectBounds(object);
        return bounds.x + bounds.width >= left && bounds.y + bounds.height >= top && bounds.x <= right && bounds.y <= bottom;
      })
      .map((object) => {
        const translated = { ...object };
        if (["arrow", "line"].includes(translated.mode)) {
          translated.startX -= left;
          translated.startY -= top;
          translated.endX -= left;
          translated.endY -= top;
          translated.controlX -= left;
          translated.controlY -= top;
        } else {
          translated.x -= left;
          translated.y -= top;
        }
        return translated;
      });
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    sourceContext.drawImage(cropped, 0, 0);
    baseCanvas.width = width;
    baseCanvas.height = height;
    canvas.width = width;
    canvas.height = height;
    activeObjectId = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    rebuildBaseCanvas();
    if (matchImageRatio) syncOutputToSourceSize();
    fitView({ notify: false });
    updatePresentationUI();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast(`Cropped to ${width} × ${height} px.`);
  }

  function undo() {
    commitPendingSettingsHistory();
    if (!history.length || isRestoring) return;
    future.push(snapshot());
    restoreSnapshot(history.pop());
    showToast("Undid last edit.");
  }

  function redo() {
    commitPendingSettingsHistory();
    if (!future.length || isRestoring) return;
    history.push(snapshot());
    restoreSnapshot(future.pop());
    showToast("Redid edit.");
  }

  function clearSelection() {
    commitPendingSettingsHistory();
    activeObjectId = null;
    objectInteraction = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    updateControls();
    render();
  }

  function deleteActiveObject() {
    const object = activeObject();
    if (!object) return false;
    rememberHistoryStep();
    placedObjects = placedObjects.filter((placedObject) => placedObject.id !== object.id);
    activeObjectId = null;
    objectInteraction = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    rebuildBaseCanvas();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast("Item removed.");
    return true;
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

  elements.canvasWrap.addEventListener("pointerdown", (event) => {
    const shouldPan = imageLoaded && (panModeEnabled || event.button === 1);
    if (!shouldPan) return;
    event.preventDefault();
    event.stopPropagation();
    elements.canvasWrap.setPointerCapture(event.pointerId);
    isPanning = true;
    panPointerStart = { x: event.clientX, y: event.clientY };
    panOrigin = { x: viewPanX, y: viewPanY };
    elements.canvasWrap.classList.add("is-panning");
  }, true);

  elements.canvasWrap.addEventListener("pointermove", (event) => {
    if (!isPanning || !panPointerStart || !panOrigin) return;
    viewPanX = panOrigin.x + event.clientX - panPointerStart.x;
    viewPanY = panOrigin.y + event.clientY - panPointerStart.y;
    updateViewTransform();
  });

  const finishPan = (event) => {
    if (!isPanning) return;
    if (elements.canvasWrap.hasPointerCapture(event.pointerId)) elements.canvasWrap.releasePointerCapture(event.pointerId);
    isPanning = false;
    panPointerStart = null;
    panOrigin = null;
    elements.canvasWrap.classList.remove("is-panning");
  };
  elements.canvasWrap.addEventListener("pointerup", finishPan);
  elements.canvasWrap.addEventListener("pointercancel", finishPan);
  elements.canvasWrap.addEventListener("wheel", (event) => {
    if (!imageLoaded || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    setViewZoom(viewZoom + (event.deltaY < 0 ? 0.15 : -0.15));
  }, { passive: false });

  canvas.addEventListener("pointerdown", (event) => {
    if (!imageLoaded || panModeEnabled || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    const selectedHandle = activeHandleAtPoint(point);
    if (activeObject() && selectedHandle) {
      beginObjectInteraction(activeObject(), point, selectedHandle);
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return;
    }

    const hitObject = findObjectAtPoint(point);
    if (hitObject) {
      if (hitObject.id !== activeObjectId) selectPlacedObject(hitObject);
      beginObjectInteraction(hitObject, point, activeHandleAtPoint(point));
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return;
    }

    commitPendingSettingsHistory();
    activeObjectId = null;
    dragStart = point;
    arrowStart = { ...dragStart };
    arrowEnd = { ...dragStart };
    selection = { x: dragStart.x, y: dragStart.y, width: 0, height: 0 };
    isSelecting = true;
    canvas.classList.add("is-selecting");
    document.body.style.userSelect = "none";
    updateControls();
    render();
  });

  canvas.addEventListener("pointermove", (event) => {
    const currentPoint = canvasPoint(event);
    if (objectInteraction) {
      updateObjectInteraction(currentPoint);
      return;
    }

    if (!isSelecting) {
      const handle = activeHandleAtPoint(currentPoint);
      if (["nw", "se"].includes(handle)) canvas.style.cursor = "nwse-resize";
      else if (["ne", "sw"].includes(handle)) canvas.style.cursor = "nesw-resize";
      else if (["start", "end", "control"].includes(handle)) canvas.style.cursor = "grab";
      else if (findObjectAtPoint(currentPoint)) canvas.style.cursor = "move";
      else canvas.style.cursor = "crosshair";
      return;
    }

    arrowEnd = { ...currentPoint };
    selection = normalizeBox(dragStart, currentPoint);
    updateControls();
    render();
  });

  function finishSelection(event) {
    if (objectInteraction) {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      document.body.style.userSelect = "";
      finishObjectInteraction();
      canvas.style.cursor = "crosshair";
      return;
    }
    if (!isSelecting) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    isSelecting = false;
    canvas.classList.remove("is-selecting");
    document.body.style.userSelect = "";
    const selectionIsTooSmall = ["arrow", "line"].includes(mode)
      ? arrowLength() < 2
      : !selection || selection.width < 2 || selection.height < 2;
    if (selectionIsTooSmall) {
      selection = null;
      arrowStart = null;
      arrowEnd = null;
    }
    updateControls();
    render();
    if (selection && mode === "text") elements.replacementText.focus({ preventScroll: true });
    else if (selection) canvas.focus({ preventScroll: true });
  }

  canvas.addEventListener("pointerup", finishSelection);
  canvas.addEventListener("pointercancel", finishSelection);
  canvas.addEventListener("keydown", (event) => {
    if (!imageLoaded) return;

    const selectedObject = activeObject();
    if (selectedObject && ["Delete", "Backspace"].includes(event.key)) {
      event.preventDefault();
      deleteActiveObject();
      return;
    }

    if (selectedObject && event.key.startsWith("Arrow")) {
      event.preventDefault();
      const step = event.altKey ? 1 : 10;
      const [requestedX, requestedY] = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }[event.key];
      const bounds = objectBounds(selectedObject);
      const deltaX = Math.max(-bounds.x, Math.min(canvas.width - bounds.x - bounds.width, requestedX));
      const deltaY = Math.max(-bounds.y, Math.min(canvas.height - bounds.y - bounds.height, requestedY));
      if (deltaX || deltaY) {
        rememberHistoryStep();
        const index = placedObjects.findIndex((object) => object.id === selectedObject.id);
        placedObjects[index] = translatedObject(selectedObject, deltaX, deltaY);
        syncSelectionFromActiveObject();
        rebuildBaseCanvas();
        updateControls();
        render();
        scheduleCurrentImageSave();
      }
      return;
    }

    if (event.key === "Enter" && selection && !selectedObject) {
      event.preventDefault();
      event.stopPropagation();
      applyCurrentTool();
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
      arrowStart = { x: selection.x, y: selection.y };
      arrowEnd = { x: selection.x + selection.width, y: selection.y + selection.height };
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
      arrowStart = { x: selection.x, y: selection.y };
      arrowEnd = { x: selection.x + selection.width, y: selection.y + selection.height };
    } else {
      const previousX = selection.x;
      const previousY = selection.y;
      selection.x = Math.max(0, Math.min(canvas.width - selection.width, selection.x + direction[0]));
      selection.y = Math.max(0, Math.min(canvas.height - selection.height, selection.y + direction[1]));
      if (arrowStart && arrowEnd) {
        const movedX = selection.x - previousX;
        const movedY = selection.y - previousY;
        arrowStart.x += movedX;
        arrowStart.y += movedY;
        arrowEnd.x += movedX;
        arrowEnd.y += movedY;
      }
    }
    updateControls();
    render();
  });

  elements.maskModeButton.addEventListener("click", () => setMode("mask"));
  elements.textModeButton.addEventListener("click", () => setMode("text"));
  elements.circleModeButton.addEventListener("click", () => setMode("circle"));
  elements.arrowModeButton.addEventListener("click", () => setMode("arrow"));
  elements.lineModeButton.addEventListener("click", () => setMode("line"));
  elements.patternButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPattern(button.dataset.patchPattern);
      if (selection && mode === "text") elements.replacementText.focus({ preventScroll: true });
      else if (selection) canvas.focus({ preventScroll: true });
    });
  });
  elements.annotationStyleButtons.forEach((button) => {
    button.addEventListener("click", () => setAnnotationStyle(button.dataset.annotationStyle));
  });
  elements.applyButton.addEventListener("click", applyCurrentTool);
  elements.cropButton.addEventListener("click", cropToSelection);
  elements.clearSelectionButton.addEventListener("click", clearSelection);
  elements.undoButton.addEventListener("click", undo);
  elements.redoButton.addEventListener("click", redo);
  elements.copyButton.addEventListener("click", copyImage);
  elements.downloadButton.addEventListener("click", downloadImage);
  elements.zoomOutButton.addEventListener("click", () => setViewZoom(viewZoom - 0.25));
  elements.zoomInButton.addEventListener("click", () => setViewZoom(viewZoom + 0.25));
  elements.fitViewButton.addEventListener("click", () => fitView());
  elements.panModeButton.addEventListener("click", () => setPanMode(!panModeEnabled));
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
    if (!window.confirm("Clear all recent tool presets?")) return;
    recentPatches = [];
    savePreference(STORAGE_KEYS.recentPatches, "[]");
    renderRecentPatches();
    showToast("Recent tools cleared.");
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
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.textColor.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.textColor, elements.textColor.value);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.annotationColor.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.annotationColor, elements.annotationColor.value);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.annotationSize.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.annotationSize, elements.annotationSize.value);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.textStyleButtons.forEach((button) => {
    button.addEventListener("click", () => setTextStyle(button.dataset.textStyle));
  });
  elements.fontSize.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.autoTextSize.addEventListener("change", () => {
    savePreference(STORAGE_KEYS.autoTextSize, String(elements.autoTextSize.checked));
    updateFontSizeUI();
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.replacementText.addEventListener("input", () => {
    updateFontSizeUI();
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  [
    elements.backgroundColor,
    elements.textColor,
    elements.annotationColor,
    elements.annotationSize,
    elements.fontSize,
    elements.autoTextSize,
    elements.replacementText,
  ].forEach((input) => input.addEventListener("change", commitPendingSettingsHistory));
  elements.replacementText.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCurrentTool();
    }
  });

  document.addEventListener("keydown", (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (
      imageLoaded &&
      activeObject() &&
      ["Delete", "Backspace"].includes(event.key) &&
      !event.target.matches("input, textarea, select")
    ) {
      event.preventDefault();
      deleteActiveObject();
      return;
    }
    if (event.key === "Escape" && panModeEnabled) {
      setPanMode(false);
      return;
    }
    if (event.key === "Escape" && selection) {
      clearSelection();
      return;
    }
    if (
      event.key === "Enter" &&
      selection &&
      !event.defaultPrevented &&
      !modifier &&
      !event.target.matches("button, input, textarea, select") &&
      !event.target.closest(".presentation-section")
    ) {
      event.preventDefault();
      applyCurrentTool();
      return;
    }
    if (!modifier || event.target.matches("input, textarea, select")) return;
    if (imageLoaded && ["=", "+"].includes(event.key)) {
      event.preventDefault();
      setViewZoom(viewZoom + 0.25);
      return;
    }
    if (imageLoaded && event.key === "-") {
      event.preventDefault();
      setViewZoom(viewZoom - 0.25);
      return;
    }
    if (imageLoaded && event.key === "0") {
      event.preventDefault();
      fitView();
      return;
    }
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
