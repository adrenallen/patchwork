(() => {
  const { calculateShareLayout, mapDocumentBounds, unmapShareBounds } = window.PatchworkShareLayout;
  const {
    extractOcrWords,
    findPhraseMatches,
    estimatePatchAppearance,
    inferFontFamily,
    inferFontWeight,
    paddedBounds,
    fitTextVerticalBounds,
  } = window.PatchworkSmartText;
  const canvas = document.querySelector("#editorCanvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const baseCanvas = document.createElement("canvas");
  const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });
  const sourceCanvas = document.createElement("canvas");
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const shareContentSurface = document.createElement("canvas");
  const shareContentSurfaceContext = shareContentSurface.getContext("2d", { willReadFrequently: true });
  const shareReflectionCanvas = document.createElement("canvas");
  const shareReflectionContext = shareReflectionCanvas.getContext("2d");

  const elements = {
    fileInput: document.querySelector("#fileInput"),
    newCanvasButton: document.querySelector("#newCanvasButton"),
    replaceImageButton: document.querySelector("#replaceImageButton"),
    pasteCard: document.querySelector("#pasteCard"),
    emptyState: document.querySelector("#emptyState"),
    canvasWrap: document.querySelector("#canvasWrap"),
    framePreview: document.querySelector("#framePreview"),
    editControls: document.querySelector("#editControls"),
    arrangeModeButton: document.querySelector("#arrangeModeButton"),
    maskModeButton: document.querySelector("#maskModeButton"),
    blurModeButton: document.querySelector("#blurModeButton"),
    textModeButton: document.querySelector("#textModeButton"),
    smartTextModeButton: document.querySelector("#smartTextModeButton"),
    circleModeButton: document.querySelector("#circleModeButton"),
    arrowModeButton: document.querySelector("#arrowModeButton"),
    lineModeButton: document.querySelector("#lineModeButton"),
    cropModeButton: document.querySelector("#cropModeButton"),
    patchFillOptions: document.querySelector("#patchFillOptions"),
    blurOptions: document.querySelector("#blurOptions"),
    blurStyleButtons: [...document.querySelectorAll(".blur-style-button")],
    blurStrength: document.querySelector("#blurStrength"),
    blurStrengthValue: document.querySelector("#blurStrengthValue"),
    textOptions: document.querySelector("#textOptions"),
    smartTextOptions: document.querySelector("#smartTextOptions"),
    analyzeTextButton: document.querySelector("#analyzeTextButton"),
    smartTextProgress: document.querySelector("#smartTextProgress"),
    smartTextProgressBar: document.querySelector("#smartTextProgressBar"),
    smartTextStatus: document.querySelector("#smartTextStatus"),
    smartTextSearch: document.querySelector("#smartTextSearch"),
    smartTextQuery: document.querySelector("#smartTextQuery"),
    smartTextCaseSensitive: document.querySelector("#smartTextCaseSensitive"),
    smartTextWholeWord: document.querySelector("#smartTextWholeWord"),
    smartTextActionButtons: [...document.querySelectorAll(".smart-text-action-button")],
    smartTextActionNote: document.querySelector("#smartTextActionNote"),
    smartTextBlurOptions: document.querySelector("#smartTextBlurOptions"),
    smartTextBlurStyleButtons: [...document.querySelectorAll(".smart-text-blur-style-button")],
    smartTextBlurStrength: document.querySelector("#smartTextBlurStrength"),
    smartTextBlurStrengthValue: document.querySelector("#smartTextBlurStrengthValue"),
    smartTextMaskOptions: document.querySelector("#smartTextMaskOptions"),
    smartTextMaskColor: document.querySelector("#smartTextMaskColor"),
    smartTextMaskColorValue: document.querySelector("#smartTextMaskColorValue"),
    smartTextMaskPatternButtons: [...document.querySelectorAll(".smart-text-pattern-button")],
    smartTextReplaceOptions: document.querySelector("#smartTextReplaceOptions"),
    smartTextReplacement: document.querySelector("#smartTextReplacement"),
    smartTextFont: document.querySelector("#smartTextFont"),
    smartTextWeight: document.querySelector("#smartTextWeight"),
    smartTextSizeScale: document.querySelector("#smartTextSizeScale"),
    smartTextSizeScaleValue: document.querySelector("#smartTextSizeScaleValue"),
    smartTextRotation: document.querySelector("#smartTextRotation"),
    smartTextRotationValue: document.querySelector("#smartTextRotationValue"),
    smartTextStyleHint: document.querySelector("#smartTextStyleHint"),
    smartTextMatchCount: document.querySelector("#smartTextMatchCount"),
    smartTextToggleMatches: document.querySelector("#smartTextToggleMatches"),
    smartTextMatchList: document.querySelector("#smartTextMatchList"),
    applySmartTextButton: document.querySelector("#applySmartTextButton"),
    applySmartTextButtonLabel: document.querySelector("#applySmartTextButtonLabel"),
    annotationOptions: document.querySelector("#annotationOptions"),
    annotationColor: document.querySelector("#annotationColor"),
    annotationColorValue: document.querySelector("#annotationColorValue"),
    annotationSize: document.querySelector("#annotationSize"),
    annotationSizeValue: document.querySelector("#annotationSizeValue"),
    annotationStyleButtons: [...document.querySelectorAll(".annotation-style-button")],
    annotationRoughnessField: document.querySelector("#annotationRoughnessField"),
    annotationRoughness: document.querySelector("#annotationRoughness"),
    annotationRoughnessValue: document.querySelector("#annotationRoughnessValue"),
    annotationNote: document.querySelector("#annotationNote"),
    backgroundColor: document.querySelector("#backgroundColor"),
    backgroundColorValue: document.querySelector("#backgroundColorValue"),
    patternButtons: [...document.querySelectorAll(".pattern-button")],
    replacementText: document.querySelector("#replacementText"),
    textColor: document.querySelector("#textColor"),
    textColorValue: document.querySelector("#textColorValue"),
    textFontButtons: [...document.querySelectorAll(".font-family-button")],
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
    addLayerButton: document.querySelector("#addLayerButton"),
    layersList: document.querySelector("#layersList"),
    layersEmpty: document.querySelector("#layersEmpty"),
    frameEnabled: document.querySelector("#frameEnabled"),
    frameToggleLabel: document.querySelector("#frameToggleLabel"),
    presentationControls: document.querySelector("#presentationControls"),
    ratioButtons: [...document.querySelectorAll(".ratio-button")],
    imageSizeReadout: document.querySelector("#imageSizeReadout"),
    exportSizeReadout: document.querySelector("#exportSizeReadout"),
    layoutStatus: document.querySelector("#layoutStatus"),
    contentPositionButtons: [...document.querySelectorAll(".content-position-button")],
    gradientButtons: [...document.querySelectorAll(".gradient-button")],
    screenshotEdgeGroup: document.querySelector("#screenshotEdgeGroup"),
    edgeLayerName: document.querySelector("#edgeLayerName"),
    edgePreview: document.querySelector("#edgePreview"),
    edgeStyleButtons: [...document.querySelectorAll(".edge-style-button")],
    edgeColorRow: document.querySelector("#edgeColorRow"),
    edgeColor: document.querySelector("#edgeColor"),
    edgeColorValue: document.querySelector("#edgeColorValue"),
    edgeGradientPresets: document.querySelector("#edgeGradientPresets"),
    edgeGradientButtons: [...document.querySelectorAll("[data-edge-gradient]")],
    edgeWidth: document.querySelector("#edgeWidth"),
    edgeWidthValue: document.querySelector("#edgeWidthValue"),
    edgeGlow: document.querySelector("#edgeGlow"),
    edgeGlowValue: document.querySelector("#edgeGlowValue"),
    canvasTextContent: document.querySelector("#canvasTextContent"),
    canvasTextFillButtons: [...document.querySelectorAll(".canvas-text-fill-button")],
    canvasTextColorRow: document.querySelector("#canvasTextColorRow"),
    canvasTextColor: document.querySelector("#canvasTextColor"),
    canvasTextColorValue: document.querySelector("#canvasTextColorValue"),
    canvasTextGradientPresets: document.querySelector("#canvasTextGradientPresets"),
    canvasTextGradientButtons: [...document.querySelectorAll("[data-canvas-text-gradient]")],
    canvasTextFontButtons: [...document.querySelectorAll(".canvas-text-font-button")],
    canvasTextStyleButtons: [...document.querySelectorAll(".canvas-text-style-button")],
    canvasTextSize: document.querySelector("#canvasTextSize"),
    canvasTextSizeValue: document.querySelector("#canvasTextSizeValue"),
    canvasTextAddButton: document.querySelector("#canvasTextAddButton"),
    paddingUnitButtons: [...document.querySelectorAll(".padding-unit-button")],
    framePaddingX: document.querySelector("#framePaddingX"),
    framePaddingY: document.querySelector("#framePaddingY"),
    paddingUnitSuffixes: [...document.querySelectorAll(".padding-unit-suffix")],
    paddingNote: document.querySelector("#paddingNote"),
    cornerRadius: document.querySelector("#cornerRadius"),
    cornerRadiusValue: document.querySelector("#cornerRadiusValue"),
    reflectionEnabled: document.querySelector("#reflectionEnabled"),
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
    textFont: "patchwork.textFont",
    textStyle: "patchwork.textStyle",
    fontSize: "patchwork.fontSize",
    autoTextSize: "patchwork.autoTextSize",
    annotationColor: "patchwork.annotationColor",
    annotationSize: "patchwork.annotationSize",
    annotationStyle: "patchwork.annotationStyle",
    annotationRoughness: "patchwork.annotationRoughness",
    pattern: "patchwork.pattern",
    recentPatches: "patchwork.recentPatches",
    frameEnabled: "patchwork.frameEnabled",
    aspectPreset: "patchwork.aspectPreset",
    gradient: "patchwork.gradient",
    framePadding: "patchwork.framePadding",
    framePaddingX: "patchwork.framePaddingX",
    framePaddingY: "patchwork.framePaddingY",
    framePaddingUnit: "patchwork.framePaddingUnit",
    cornerRadius: "patchwork.cornerRadius",
    reflectionEnabled: "patchwork.reflectionEnabled",
    toolSettings: "patchwork.toolSettings",
    smartTextFont: "patchwork.smartTextFont",
    smartTextWeight: "patchwork.smartTextWeight",
    smartTextSizeScale: "patchwork.smartTextSizeScale",
    smartTextRotation: "patchwork.smartTextRotation",
    smartTextBlurStyle: "patchwork.smartTextBlurStyle",
    smartTextBlurStrength: "patchwork.smartTextBlurStrength",
    smartTextMaskColor: "patchwork.smartTextMaskColor",
    smartTextMaskPattern: "patchwork.smartTextMaskPattern",
    canvasTextSettings: "patchwork.canvasTextSettings",
    screenshotEdgeSettings: "patchwork.screenshotEdgeSettings",
    contentPosition: "patchwork.contentPosition",
  };

  const GRADIENTS = {
    dusk: { angle: 135, stops: ["#5b4bdb", "#b44ad7", "#f28b66"] },
    tide: { angle: 135, stops: ["#08b6d8", "#2563eb", "#6336cc"] },
    mango: { angle: 135, stops: ["#ffd36e", "#ff8a65", "#c45acb"] },
    iris: { angle: 135, stops: ["#363795", "#8b5cf6", "#ec4899"] },
    mint: { angle: 135, stops: ["#b9fbc0", "#39c6b0", "#157a87"] },
    graphite: { angle: 135, stops: ["#64748b", "#26354b", "#0f172a"] },
  };

  const ASPECT_RATIOS = {
    image: null,
    square: 1,
    portrait: 4 / 5,
    landscape: 16 / 9,
    story: 9 / 16,
  };

  const TEXT_FONTS = {
    sans: { label: "Sans", family: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    serif: { label: "Serif", family: 'Georgia, "Times New Roman", serif' },
    mono: { label: "Mono", family: '"SFMono-Regular", Consolas, "Liberation Mono", monospace' },
    hand: { label: "Hand", family: '"Marker Felt", "Bradley Hand", "Comic Sans MS", cursive' },
  };

  const IMAGE_DB_NAME = "patchwork-image-history";
  const IMAGE_DB_VERSION = 1;
  const IMAGE_STORE_NAME = "images";
  const MAX_SAVED_IMAGES = 7;
  const MAX_RECENT_PATCHES = 10;
  const MIN_VIEW_ZOOM = 0.5;
  const MAX_VIEW_ZOOM = 4;
  const ROUGHNESS_LABELS = ["", "Neat", "Natural", "Loose", "Messy", "Scribbly"];
  const TESSERACT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js";

  let imageLoaded = false;
  let imageName = "image";
  let imageLabel = "Pasted image";
  let mode = "mask";
  let pattern = "solid";
  let textFont = "sans";
  let textStyle = "bold";
  let annotationStyle = "clean";
  let annotationRoughness = 3;
  let smartTextAction = "remove";
  let smartTextFont = "auto";
  let smartTextWeight = "auto";
  let smartTextSizeScale = 100;
  let smartTextRotation = 0;
  let smartTextBlurStyle = "gaussian";
  let smartTextBlurStrength = 14;
  let smartTextMaskPattern = "solid";
  let smartTextWords = [];
  let smartTextMatches = [];
  let smartTextAnalyzing = false;
  let smartTextRevision = null;
  let ocrLibraryPromise = null;
  let ocrWorkerPromise = null;
  let documentRevision = 0;
  let frameEnabled = false;
  let aspectPreset = "image";
  let gradientName = "dusk";
  let paddingUnit = "percent";
  let contentPosition = "center";
  let reflectionEnabled = false;
  let canvasTextFill = "solid";
  let canvasTextGradient = "tide";
  let canvasTextFont = "sans";
  let canvasTextStyle = "bold";
  let screenshotEdgeDefaults = {
    edgeStyle: "none",
    edgeColor: "#4f7cff",
    edgeGradient: "tide",
    edgeWidth: 3,
    edgeGlow: 18,
  };
  let blurStyle = "gaussian";
  let blurStrength = 14;
  let toolSettings = {};
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
  let imageLayers = [];
  let activeImageLayerId = null;
  let imageLayerInteraction = null;
  let filePickerIntent = "replace";
  let activeObjectId = null;
  let selectedObjectIds = new Set();
  let objectInteraction = null;
  let selectionInteraction = null;
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

  function cloneImageLayers(layers = imageLayers) {
    return layers.map((layer) => ({ ...layer }));
  }

  function storedImageLayers(layers = imageLayers) {
    return layers.map(({
      image,
      shareCustomized,
      shareX,
      shareY,
      shareWidth,
      shareHeight,
      ...layer
    }) => ({ ...layer }));
  }

  async function hydrateImageLayers(layers = []) {
    return Promise.all(layers.map(async (layer) => ({
      ...layer,
      image: await imageFromBlob(layer.blob),
    })));
  }

  function activeImageLayer() {
    return imageLayers.find((layer) => layer.id === activeImageLayerId) || null;
  }

  function edgeTargetLayer() {
    return activeImageLayer() || [...imageLayers].reverse().find((layer) => layer.visible !== false) || null;
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
      layers: storedImageLayers(),
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
    const legacyBackground = readPreference(STORAGE_KEYS.backgroundColor, "#111827");
    const legacyTextColor = readPreference(STORAGE_KEYS.textColor, "#ffffff");
    const legacyFontSize = clampNumber(readPreference(STORAGE_KEYS.fontSize, "28"), 8, 160, 28);
    const legacyAutoTextSize = readPreference(STORAGE_KEYS.autoTextSize, "true") === "true";
    const legacyAnnotationColor = readPreference(STORAGE_KEYS.annotationColor, "#ef4444");
    const legacyAnnotationSize = clampNumber(readPreference(STORAGE_KEYS.annotationSize, "6"), 2, 28, 6);
    const legacyRoughness = clampNumber(readPreference(STORAGE_KEYS.annotationRoughness, "3"), 1, 5, 3);
    const savedAnnotationStyle = readPreference(STORAGE_KEYS.annotationStyle, "clean");
    const savedTextFont = readPreference(STORAGE_KEYS.textFont, "sans");
    const savedTextStyle = readPreference(STORAGE_KEYS.textStyle, "bold");
    const savedPattern = readPreference(STORAGE_KEYS.pattern, "solid");
    const legacyPattern = ["solid", "diagonal", "hatch"].includes(savedPattern) ? savedPattern : "solid";
    const markerDefaults = {
      annotationColor: legacyAnnotationColor,
      annotationSize: legacyAnnotationSize,
      annotationStyle: ["clean", "hand"].includes(savedAnnotationStyle) ? savedAnnotationStyle : "clean",
      annotationRoughness: legacyRoughness,
    };
    const defaults = {
      mask: { backgroundColor: legacyBackground, pattern: legacyPattern },
      text: {
        backgroundColor: legacyBackground,
        pattern: "solid",
        text: "",
        textColor: legacyTextColor,
        textFont: TEXT_FONTS[savedTextFont] ? savedTextFont : "sans",
        textStyle: ["normal", "bold", "italic"].includes(savedTextStyle) ? savedTextStyle : "bold",
        fontSize: legacyFontSize,
        autoTextSize: legacyAutoTextSize,
      },
      blur: { blurStyle: "gaussian", blurStrength: 14 },
      circle: { ...markerDefaults },
      arrow: { ...markerDefaults },
      line: { ...markerDefaults },
    };
    try {
      const savedToolSettings = JSON.parse(readPreference(STORAGE_KEYS.toolSettings, "{}"));
      toolSettings = Object.fromEntries(Object.entries(defaults).map(([tool, values]) => [
        tool,
        { ...values, ...(savedToolSettings?.[tool] || {}) },
      ]));
    } catch {
      toolSettings = defaults;
    }
    applyToolSettings("mask");
    frameEnabled = readPreference(STORAGE_KEYS.frameEnabled, "false") === "true";
    reflectionEnabled = readPreference(STORAGE_KEYS.reflectionEnabled, "false") === "true";
    const savedAspectPreset = readPreference(STORAGE_KEYS.aspectPreset, "image");
    aspectPreset = Object.hasOwn(ASPECT_RATIOS, savedAspectPreset) ? savedAspectPreset : "image";
    const savedContentPosition = readPreference(STORAGE_KEYS.contentPosition, "center");
    contentPosition = ["left", "center", "right"].includes(savedContentPosition) ? savedContentPosition : "center";
    gradientName = readPreference(STORAGE_KEYS.gradient, "dusk");
    if (gradientName !== "transparent" && !GRADIENTS[gradientName]) gradientName = "dusk";
    elements.frameEnabled.checked = frameEnabled;
    elements.reflectionEnabled.checked = reflectionEnabled;
    savePreference(STORAGE_KEYS.aspectPreset, aspectPreset);
    const legacyFramePadding = clampDecimal(readPreference(STORAGE_KEYS.framePadding, "10"), 0, 49, 10, 1);
    const savedPaddingUnit = readPreference(STORAGE_KEYS.framePaddingUnit, "percent");
    paddingUnit = ["percent", "pixels"].includes(savedPaddingUnit) ? savedPaddingUnit : "percent";
    const paddingMaximum = paddingUnit === "pixels" ? 6000 : 49;
    const paddingPrecision = paddingUnit === "pixels" ? 0 : 2;
    elements.framePaddingX.value = String(clampDecimal(
      readPreference(STORAGE_KEYS.framePaddingX, String(legacyFramePadding)),
      0,
      paddingMaximum,
      legacyFramePadding,
      paddingPrecision,
    ));
    elements.framePaddingY.value = String(clampDecimal(
      readPreference(STORAGE_KEYS.framePaddingY, String(legacyFramePadding)),
      0,
      paddingMaximum,
      legacyFramePadding,
      paddingPrecision,
    ));
    elements.cornerRadius.value = String(clampNumber(readPreference(STORAGE_KEYS.cornerRadius, "24"), 0, 64, 24));
    try {
      const savedCanvasText = JSON.parse(readPreference(STORAGE_KEYS.canvasTextSettings, "{}"));
      canvasTextFill = ["solid", "gradient"].includes(savedCanvasText.fill) ? savedCanvasText.fill : "solid";
      canvasTextGradient = GRADIENTS[savedCanvasText.gradient] ? savedCanvasText.gradient : "tide";
      canvasTextFont = TEXT_FONTS[savedCanvasText.font] ? savedCanvasText.font : "sans";
      canvasTextStyle = ["normal", "bold", "italic"].includes(savedCanvasText.style) ? savedCanvasText.style : "bold";
      elements.canvasTextContent.value = savedCanvasText.text || "Your headline";
      elements.canvasTextColor.value = savedCanvasText.color || "#ffffff";
      elements.canvasTextSize.value = String(clampNumber(savedCanvasText.size, 12, 240, 72));
    } catch {
      // Keep the visible canvas text defaults.
    }
    try {
      const savedEdge = JSON.parse(readPreference(STORAGE_KEYS.screenshotEdgeSettings, "{}"));
      screenshotEdgeDefaults = {
        edgeStyle: ["none", "solid", "gradient"].includes(savedEdge.edgeStyle) ? savedEdge.edgeStyle : "none",
        edgeColor: savedEdge.edgeColor || "#4f7cff",
        edgeGradient: GRADIENTS[savedEdge.edgeGradient] ? savedEdge.edgeGradient : "tide",
        edgeWidth: clampNumber(savedEdge.edgeWidth, 1, 16, 3),
        edgeGlow: clampNumber(savedEdge.edgeGlow, 0, 48, 18),
      };
    } catch {
      // Keep the visible screenshot edge defaults.
    }
    const savedSmartFont = readPreference(STORAGE_KEYS.smartTextFont, "auto");
    const savedSmartWeight = readPreference(STORAGE_KEYS.smartTextWeight, "auto");
    smartTextFont = ["auto", ...Object.keys(TEXT_FONTS)].includes(savedSmartFont) ? savedSmartFont : "auto";
    smartTextWeight = ["auto", "normal", "bold"].includes(savedSmartWeight) ? savedSmartWeight : "auto";
    smartTextSizeScale = clampNumber(readPreference(STORAGE_KEYS.smartTextSizeScale, "100"), 1, 200, 100);
    smartTextRotation = clampNumber(readPreference(STORAGE_KEYS.smartTextRotation, "0"), -180, 180, 0);
    smartTextBlurStyle = ["gaussian", "pixelize"].includes(readPreference(STORAGE_KEYS.smartTextBlurStyle, "gaussian"))
      ? readPreference(STORAGE_KEYS.smartTextBlurStyle, "gaussian")
      : "gaussian";
    smartTextBlurStrength = clampNumber(readPreference(STORAGE_KEYS.smartTextBlurStrength, "14"), 2, 40, 14);
    smartTextMaskPattern = ["solid", "diagonal", "hatch"].includes(readPreference(STORAGE_KEYS.smartTextMaskPattern, "solid"))
      ? readPreference(STORAGE_KEYS.smartTextMaskPattern, "solid")
      : "solid";
    elements.smartTextFont.value = smartTextFont;
    elements.smartTextWeight.value = smartTextWeight;
    elements.smartTextSizeScale.value = String(smartTextSizeScale);
    elements.smartTextRotation.value = String(smartTextRotation);
    elements.smartTextBlurStrength.value = String(smartTextBlurStrength);
    elements.smartTextMaskColor.value = readPreference(STORAGE_KEYS.smartTextMaskColor, legacyBackground);
    updateSmartTextOptionUI();
    updateCanvasTextControls();
    updateScreenshotEdgeControls();
    updatePresentationUI();
    loadRecentPatches();
    updatePreferenceLabels();
  }

  function clampNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.round(number))) : fallback;
  }

  function clampDecimal(value, minimum, maximum, fallback, precision = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    const scale = 10 ** precision;
    return Math.round(Math.min(maximum, Math.max(minimum, number)) * scale) / scale;
  }

  function saveToolSettings() {
    savePreference(STORAGE_KEYS.toolSettings, JSON.stringify(toolSettings));
  }

  function captureToolSettings(tool = mode) {
    if (tool === "mask") {
      toolSettings.mask = { backgroundColor: elements.backgroundColor.value, pattern };
    } else if (tool === "text") {
      toolSettings.text = {
        backgroundColor: elements.backgroundColor.value,
        pattern,
        text: elements.replacementText.value,
        textColor: elements.textColor.value,
        textFont,
        textStyle,
        fontSize: Number(elements.fontSize.value),
        autoTextSize: elements.autoTextSize.checked,
      };
    } else if (tool === "blur") {
      toolSettings.blur = { blurStyle, blurStrength };
    } else if (["circle", "arrow", "line"].includes(tool)) {
      toolSettings[tool] = {
        annotationColor: elements.annotationColor.value,
        annotationSize: Number(elements.annotationSize.value),
        annotationStyle,
        annotationRoughness,
      };
    } else {
      return;
    }
    saveToolSettings();
  }

  function applyToolSettings(tool) {
    const settings = toolSettings[tool];
    if (!settings) return;
    if (["mask", "text"].includes(tool)) {
      elements.backgroundColor.value = settings.backgroundColor || "#111827";
      pattern = ["solid", "diagonal", "hatch"].includes(settings.pattern) ? settings.pattern : "solid";
      elements.patternButtons.forEach((button) => {
        const active = button.dataset.patchPattern === pattern;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    if (tool === "text") {
      elements.replacementText.value = settings.text || "";
      elements.textColor.value = settings.textColor || "#ffffff";
      elements.fontSize.value = String(clampNumber(settings.fontSize, 8, 160, 28));
      elements.autoTextSize.checked = settings.autoTextSize !== false;
      textFont = TEXT_FONTS[settings.textFont] ? settings.textFont : "sans";
      elements.textFontButtons.forEach((button) => {
        const active = button.dataset.textFont === textFont;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      textStyle = ["normal", "bold", "italic"].includes(settings.textStyle) ? settings.textStyle : "bold";
      elements.textStyleButtons.forEach((button) => {
        const active = button.dataset.textStyle === textStyle;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    if (tool === "blur") {
      blurStyle = ["gaussian", "pixelize"].includes(settings.blurStyle) ? settings.blurStyle : "gaussian";
      blurStrength = clampNumber(settings.blurStrength, 2, 40, 14);
      elements.blurStrength.value = String(blurStrength);
      elements.blurStrengthValue.value = blurStyle === "pixelize" ? `${blurStrength} px` : `${blurStrength}`;
      elements.blurStyleButtons.forEach((button) => {
        const active = button.dataset.blurStyle === blurStyle;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    if (["circle", "arrow", "line"].includes(tool)) {
      elements.annotationColor.value = settings.annotationColor || "#ef4444";
      elements.annotationSize.value = String(clampNumber(settings.annotationSize, 2, 28, 6));
      annotationStyle = ["clean", "hand"].includes(settings.annotationStyle) ? settings.annotationStyle : "clean";
      annotationRoughness = clampNumber(settings.annotationRoughness, 1, 5, 3);
      elements.annotationRoughness.value = String(annotationRoughness);
      elements.annotationRoughnessValue.value = roughnessLabel();
      elements.annotationRoughnessField.hidden = annotationStyle !== "hand";
      elements.annotationStyleButtons.forEach((button) => {
        const active = button.dataset.annotationStyle === annotationStyle;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    updatePreferenceLabels();
  }

  function paddingInputSettings(unit = paddingUnit) {
    return unit === "pixels"
      ? { maximum: 6000, precision: 0, step: "1", suffix: "px" }
      : { maximum: 49, precision: 2, step: "0.01", suffix: "%" };
  }

  function getPaddingValues(unit = paddingUnit) {
    const settings = paddingInputSettings(unit);
    return {
      x: clampDecimal(elements.framePaddingX.value, 0, settings.maximum, 0, settings.precision),
      y: clampDecimal(elements.framePaddingY.value, 0, settings.maximum, 0, settings.precision),
    };
  }

  function getShareLayout() {
    const padding = getPaddingValues();
    return calculateShareLayout({
      contentWidth: documentWidth(),
      contentHeight: documentHeight(),
      paddingX: padding.x,
      paddingY: padding.y,
      paddingUnit,
      aspectRatio: ASPECT_RATIOS[aspectPreset],
      contentPosition,
      reflection: reflectionEnabled,
    });
  }

  function getOutputDimensions() {
    return frameEnabled
      ? getShareLayout().dimensions
      : { width: documentWidth(), height: documentHeight() };
  }

  function documentWidth() {
    return sourceCanvas.width || baseCanvas.width || 1;
  }

  function documentHeight() {
    return sourceCanvas.height || baseCanvas.height || 1;
  }

  function shareContentTransform() {
    return getShareLayout().content;
  }

  function imageLayerBounds(layer) {
    if (!frameEnabled) return { x: layer.x, y: layer.y, width: layer.width, height: layer.height };
    return mapDocumentBounds(layer, shareContentTransform());
  }

  function applyShareBoundsToLayer(layer, bounds) {
    Object.assign(layer, unmapShareBounds(bounds, shareContentTransform()));
    delete layer.shareCustomized;
    delete layer.shareX;
    delete layer.shareY;
    delete layer.shareWidth;
    delete layer.shareHeight;
  }

  function documentPointFromShare(point) {
    const transform = shareContentTransform();
    return {
      x: Math.max(0, Math.min(documentWidth(), (point.x - transform.x) / transform.scale)),
      y: Math.max(0, Math.min(documentHeight(), (point.y - transform.y) / transform.scale)),
    };
  }

  function gradientCss(name = gradientName) {
    if (name === "transparent") return "transparent";
    const gradient = GRADIENTS[name] || GRADIENTS.dusk;
    return `linear-gradient(${gradient.angle}deg, ${gradient.stops.join(", ")})`;
  }

  function savePaddingPreferences() {
    savePreference(STORAGE_KEYS.framePaddingUnit, paddingUnit);
    savePreference(STORAGE_KEYS.framePaddingX, elements.framePaddingX.value);
    savePreference(STORAGE_KEYS.framePaddingY, elements.framePaddingY.value);
  }

  function updatePaddingControlUI() {
    const settings = paddingInputSettings();
    elements.paddingUnitButtons.forEach((button) => {
      const active = button.dataset.paddingUnit === paddingUnit;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    [elements.framePaddingX, elements.framePaddingY].forEach((input) => {
      input.max = String(settings.maximum);
      input.step = settings.step;
      input.inputMode = paddingUnit === "pixels" ? "numeric" : "decimal";
    });
    elements.paddingUnitSuffixes.forEach((suffix) => {
      suffix.textContent = settings.suffix;
    });
    elements.paddingNote.textContent = paddingUnit === "pixels"
      ? "Pixels build the canvas; Image position redistributes horizontal space."
      : "Percent builds the canvas; Image position redistributes horizontal space.";
  }

  function normalizePaddingInputs({ update = true } = {}) {
    const padding = getPaddingValues();
    elements.framePaddingX.value = String(padding.x);
    elements.framePaddingY.value = String(padding.y);
    savePaddingPreferences();
    scheduleCurrentImageSave();
    if (update) updatePresentationUI();
  }

  function setPaddingUnit(nextUnit) {
    if (!["percent", "pixels"].includes(nextUnit) || nextUnit === paddingUnit) return;
    const previousUnit = paddingUnit;
    const previousPadding = getPaddingValues(previousUnit);
    const dimensions = { width: documentWidth(), height: documentHeight() };
    paddingUnit = nextUnit;
    const converted = nextUnit === "pixels"
      ? {
          x: Math.round(dimensions.width * previousPadding.x / 100),
          y: Math.round(dimensions.height * previousPadding.y / 100),
        }
      : {
          x: clampDecimal(previousPadding.x / dimensions.width * 100, 0, 49, 0, 2),
          y: clampDecimal(previousPadding.y / dimensions.height * 100, 0, 49, 0, 2),
        };
    elements.framePaddingX.value = String(converted.x);
    elements.framePaddingY.value = String(converted.y);
    updatePaddingControlUI();
    normalizePaddingInputs();
    showToast(`Padding now uses ${nextUnit === "pixels" ? "pixels" : "percent"}.`);
  }

  function shareHasBackgroundArea() {
    const layout = getShareLayout();
    const visibleHeight = layout.content.height + layout.reflection.height + layout.reflection.gap;
    return layout.dimensions.width > layout.content.width + 0.5
      || layout.dimensions.height > visibleHeight + 0.5;
  }

  function frameBackgroundIsTransparent() {
    return gradientName === "transparent" || !shareHasBackgroundArea();
  }

  function updatePresentationUI() {
    elements.frameEnabled.checked = frameEnabled;
    elements.reflectionEnabled.checked = reflectionEnabled;
    elements.frameToggleLabel.textContent = frameEnabled ? "On" : "Off";
    elements.presentationControls.hidden = !frameEnabled;
    updateCanvasTextControls();
    updateScreenshotEdgeControls();
    updatePaddingControlUI();
    elements.cornerRadiusValue.value = `${elements.cornerRadius.value} px`;

    elements.ratioButtons.forEach((button) => {
      const isActive = button.dataset.aspect === aspectPreset;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    elements.contentPositionButtons.forEach((button) => {
      const isActive = button.dataset.contentPosition === contentPosition;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    elements.gradientButtons.forEach((button) => {
      const isActive = button.dataset.gradient === gradientName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (imageLoaded) {
      const layout = getShareLayout();
      elements.imageSizeReadout.textContent = `${documentWidth()} × ${documentHeight()}`;
      elements.exportSizeReadout.textContent = `${layout.dimensions.width} × ${layout.dimensions.height}`;
      if (layout.constrained) {
        elements.layoutStatus.textContent = "Export reduced to stay within browser canvas limits.";
      } else if (contentPosition !== "center") {
        elements.layoutStatus.textContent = `Image shifted ${contentPosition} to open a text column; resolution stays 1:1.`;
      } else if (aspectPreset === "image") {
        elements.layoutStatus.textContent = "Extra padding sets the canvas; the image stays at 1:1 pixels.";
      } else {
        const presetButton = elements.ratioButtons.find((button) => button.dataset.aspect === aspectPreset);
        const ratioLabel = presetButton?.querySelector("small")?.textContent || "the selected ratio";
        elements.layoutStatus.textContent = `${ratioLabel} adds background as needed; the image stays at 1:1 pixels.`;
      }
    } else {
      elements.imageSizeReadout.textContent = "Waiting";
      elements.exportSizeReadout.textContent = "Waiting";
      elements.layoutStatus.textContent = "Load an image to preview the export canvas.";
    }
    updateFramePreview();
  }

  function setAspectPreset(button) {
    aspectPreset = button.dataset.aspect;
    savePreference(STORAGE_KEYS.aspectPreset, aspectPreset);
    scheduleCurrentImageSave();
    updatePresentationUI();
  }

  function setContentPosition(position) {
    contentPosition = ["left", "right"].includes(position) ? position : "center";
    savePreference(STORAGE_KEYS.contentPosition, contentPosition);
    scheduleCurrentImageSave();
    updatePresentationUI();
  }

  function setGradient(name) {
    gradientName = (name === "transparent" || GRADIENTS[name]) ? name : "dusk";
    savePreference(STORAGE_KEYS.gradient, gradientName);
    updatePresentationUI();
  }

  function saveCanvasTextPreferences() {
    savePreference(STORAGE_KEYS.canvasTextSettings, JSON.stringify({
      text: elements.canvasTextContent.value,
      fill: canvasTextFill,
      color: elements.canvasTextColor.value,
      gradient: canvasTextGradient,
      font: canvasTextFont,
      style: canvasTextStyle,
      size: Number(elements.canvasTextSize.value),
    }));
  }

  function updateCanvasTextControls() {
    elements.canvasTextFillButtons.forEach((button) => {
      const active = button.dataset.canvasTextFill === canvasTextFill;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.canvasTextColorRow.hidden = canvasTextFill !== "solid";
    elements.canvasTextGradientPresets.hidden = canvasTextFill !== "gradient";
    elements.canvasTextGradientButtons.forEach((button) => {
      const active = button.dataset.canvasTextGradient === canvasTextGradient;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.canvasTextFontButtons.forEach((button) => {
      const active = button.dataset.canvasTextFont === canvasTextFont;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.canvasTextStyleButtons.forEach((button) => {
      const active = button.dataset.canvasTextStyle === canvasTextStyle;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.canvasTextColorValue.value = elements.canvasTextColor.value.toUpperCase();
    elements.canvasTextSizeValue.value = `${elements.canvasTextSize.value} px`;
    elements.canvasTextAddButton.disabled = !imageLoaded || !frameEnabled || !elements.canvasTextContent.value.trim();
    saveCanvasTextPreferences();
  }

  function loadCanvasTextObjectIntoControls(object) {
    if (!object || object.mode !== "canvas-text") return;
    elements.canvasTextContent.value = object.text || "";
    canvasTextFill = object.fillMode === "gradient" ? "gradient" : "solid";
    elements.canvasTextColor.value = object.textColor || "#ffffff";
    canvasTextGradient = GRADIENTS[object.gradientName] ? object.gradientName : "tide";
    canvasTextFont = TEXT_FONTS[object.textFont] ? object.textFont : "sans";
    canvasTextStyle = ["normal", "bold", "italic"].includes(object.textStyle) ? object.textStyle : "bold";
    elements.canvasTextSize.value = String(clampNumber(object.fontSize, 12, 240, 72));
    updateCanvasTextControls();
  }

  function syncCanvasTextObjectFromControls() {
    const object = activeObject();
    saveCanvasTextPreferences();
    if (!object || object.mode !== "canvas-text") {
      updateCanvasTextControls();
      return;
    }
    if (!pendingSettingsHistory) pendingSettingsHistory = snapshot();
    object.text = elements.canvasTextContent.value;
    object.fillMode = canvasTextFill;
    object.textColor = elements.canvasTextColor.value;
    object.gradientName = canvasTextGradient;
    object.textFont = canvasTextFont;
    object.textStyle = canvasTextStyle;
    object.fontSize = clampNumber(elements.canvasTextSize.value, 12, 240, 72);
    updateCanvasTextControls();
    syncSelectionFromActiveObject();
    renderLayers();
    render();
    scheduleCurrentImageSave();
    window.clearTimeout(settingsHistoryTimer);
    settingsHistoryTimer = window.setTimeout(commitPendingSettingsHistory, 450);
  }

  function createCanvasTextLayer() {
    const text = elements.canvasTextContent.value.trim();
    if (!imageLoaded || !frameEnabled || !text) return;
    commitPendingSettingsHistory();
    rememberHistoryStep();
    const layout = getShareLayout();
    const dimensions = layout.dimensions;
    const fontSize = clampNumber(elements.canvasTextSize.value, 12, 240, 72);
    const lineCount = Math.max(1, text.split("\n").length);
    const leftSpace = layout.content.x;
    const rightSpace = dimensions.width - layout.content.x - layout.content.width;
    const useLeftSpace = leftSpace >= rightSpace;
    const sideSpace = Math.max(leftSpace, rightSpace);
    const sideMargin = Math.max(12, Math.min(32, dimensions.width * 0.035));
    const hasTextColumn = sideSpace >= Math.max(120, fontSize * 2.5);
    const width = hasTextColumn
      ? Math.max(80, sideSpace - sideMargin * 2)
      : Math.max(80, Math.min(dimensions.width * 0.42, fontSize * 10));
    const height = Math.max(fontSize * 1.25, Math.min(dimensions.height * 0.56, fontSize * lineCount * 1.12));
    const object = {
      id: createObjectId(),
      mode: "canvas-text",
      space: "share",
      x: hasTextColumn
        ? (useLeftSpace ? sideMargin : layout.content.x + layout.content.width + sideMargin)
        : Math.max(12, dimensions.width * 0.055),
      y: Math.max(12, dimensions.height * 0.24),
      width,
      height,
      rotation: 0,
      text,
      fillMode: canvasTextFill,
      textColor: elements.canvasTextColor.value,
      gradientName: canvasTextGradient,
      textFont: canvasTextFont,
      textStyle: canvasTextStyle,
      fontSize,
      lineHeight: 1.04,
      scaleTextOnResize: true,
    };
    placedObjects.push(object);
    selectOnlyObject(object);
    activeImageLayerId = null;
    syncSelectionFromActiveObject();
    setMode("canvas-text", { preserveActive: true, loadSettings: false });
    renderLayers();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast("Canvas text added. Drag it anywhere on the export.");
    canvas.focus({ preventScroll: true });
  }

  function edgeSettingsFor(layer = edgeTargetLayer()) {
    return {
      edgeStyle: ["none", "solid", "gradient"].includes(layer?.edgeStyle)
        ? layer.edgeStyle
        : screenshotEdgeDefaults.edgeStyle,
      edgeColor: layer?.edgeColor || screenshotEdgeDefaults.edgeColor,
      edgeGradient: GRADIENTS[layer?.edgeGradient] ? layer.edgeGradient : screenshotEdgeDefaults.edgeGradient,
      edgeWidth: clampNumber(layer?.edgeWidth, 1, 16, screenshotEdgeDefaults.edgeWidth),
      edgeGlow: clampNumber(layer?.edgeGlow, 0, 48, screenshotEdgeDefaults.edgeGlow),
    };
  }

  function updateScreenshotEdgeControls() {
    const layer = edgeTargetLayer();
    const settings = edgeSettingsFor(layer);
    elements.screenshotEdgeGroup.disabled = !layer;
    elements.edgeLayerName.textContent = layer?.name || "No screenshot selected";
    elements.edgeColor.value = settings.edgeColor;
    elements.edgeColorValue.value = settings.edgeColor.toUpperCase();
    elements.edgeWidth.value = String(settings.edgeWidth);
    elements.edgeWidthValue.value = `${settings.edgeWidth} px`;
    elements.edgeGlow.value = String(settings.edgeGlow);
    elements.edgeGlowValue.value = String(settings.edgeGlow);
    elements.edgeColorRow.hidden = settings.edgeStyle !== "solid";
    elements.edgeGradientPresets.hidden = settings.edgeStyle !== "gradient";
    elements.edgeStyleButtons.forEach((button) => {
      const active = button.dataset.edgeStyle === settings.edgeStyle;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.edgeGradientButtons.forEach((button) => {
      const active = button.dataset.edgeGradient === settings.edgeGradient;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const previewColor = settings.edgeStyle === "gradient"
      ? gradientCss(settings.edgeGradient)
      : settings.edgeColor;
    elements.edgePreview.classList.toggle("is-off", settings.edgeStyle === "none");
    elements.edgePreview.style.setProperty("--edge-color", previewColor);
    elements.edgePreview.style.setProperty(
      "--edge-glow-color",
      settings.edgeStyle === "gradient"
        ? `${(GRADIENTS[settings.edgeGradient] || GRADIENTS.tide).stops[1]}c2`
        : `${settings.edgeColor}c2`,
    );
    elements.edgePreview.style.setProperty("--edge-width", `${Math.max(1, Math.min(5, settings.edgeWidth / 2))}px`);
    elements.edgePreview.style.setProperty("--edge-glow", `${Math.min(24, settings.edgeGlow)}px`);
  }

  function syncScreenshotEdgeFromControls(overrides = {}) {
    const layer = edgeTargetLayer();
    if (!layer) return;
    if (!pendingSettingsHistory) pendingSettingsHistory = snapshot();
    const settings = {
      ...edgeSettingsFor(layer),
      edgeColor: elements.edgeColor.value,
      edgeWidth: clampNumber(elements.edgeWidth.value, 1, 16, 3),
      edgeGlow: clampNumber(elements.edgeGlow.value, 0, 48, 18),
      ...overrides,
    };
    Object.assign(layer, settings);
    screenshotEdgeDefaults = { ...settings };
    savePreference(STORAGE_KEYS.screenshotEdgeSettings, JSON.stringify(screenshotEdgeDefaults));
    updateScreenshotEdgeControls();
    renderLayers();
    render();
    scheduleCurrentImageSave();
    window.clearTimeout(settingsHistoryTimer);
    settingsHistoryTimer = window.setTimeout(commitPendingSettingsHistory, 450);
  }

  function setSmartTextStatus(message, { progress = null, visible = true } = {}) {
    elements.smartTextProgress.hidden = !visible;
    elements.smartTextStatus.textContent = message;
    if (progress !== null) elements.smartTextProgressBar.value = Math.max(0, Math.min(1, progress));
  }

  function readableOcrStatus(status) {
    return {
      "loading tesseract core": "Loading OCR engine…",
      "initializing tesseract": "Starting OCR engine…",
      "loading language traineddata": "Loading English text model…",
      "initializing api": "Preparing text recognition…",
      "recognizing text": "Reading image text…",
    }[status] || "Analyzing image text…";
  }

  function loadOcrLibrary() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (ocrLibraryPromise) return ocrLibraryPromise;
    ocrLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TESSERACT_SCRIPT_URL;
      script.crossOrigin = "anonymous";
      script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("OCR engine did not initialize."));
      script.onerror = () => reject(new Error("OCR engine download failed."));
      document.head.append(script);
    });
    return ocrLibraryPromise;
  }

  async function getOcrWorker() {
    if (ocrWorkerPromise) return ocrWorkerPromise;
    ocrWorkerPromise = loadOcrLibrary().then((tesseract) => tesseract.createWorker(
      "eng",
      tesseract.OEM?.LSTM_ONLY ?? 1,
      {
        logger(message) {
          if (!smartTextAnalyzing) return;
          setSmartTextStatus(readableOcrStatus(message.status), {
            progress: Number.isFinite(message.progress) ? message.progress : 0,
          });
        },
      },
    ));
    ocrWorkerPromise.catch(() => {
      ocrWorkerPromise = null;
      ocrLibraryPromise = null;
    });
    return ocrWorkerPromise;
  }

  function ocrInputCanvas() {
    const maximumEdge = 3000;
    const scale = Math.min(1, maximumEdge / Math.max(baseCanvas.width, baseCanvas.height));
    if (scale === 1) return { canvas: baseCanvas, scale };
    const ocrCanvas = document.createElement("canvas");
    ocrCanvas.width = Math.max(1, Math.round(baseCanvas.width * scale));
    ocrCanvas.height = Math.max(1, Math.round(baseCanvas.height * scale));
    const ocrContext = ocrCanvas.getContext("2d");
    ocrContext.imageSmoothingEnabled = true;
    ocrContext.imageSmoothingQuality = "high";
    ocrContext.drawImage(baseCanvas, 0, 0, ocrCanvas.width, ocrCanvas.height);
    return { canvas: ocrCanvas, scale };
  }

  function scaleOcrWords(words, scale) {
    if (scale === 1) return words;
    return words.map((word) => ({
      ...word,
      bbox: {
        x0: word.bbox.x0 / scale,
        y0: word.bbox.y0 / scale,
        x1: word.bbox.x1 / scale,
        y1: word.bbox.y1 / scale,
      },
      baseline: word.baseline ? {
        x0: word.baseline.x0 / scale,
        y0: word.baseline.y0 / scale,
        x1: word.baseline.x1 / scale,
        y1: word.baseline.y1 / scale,
      } : null,
      rowHeight: Number(word.rowHeight || 0) / scale,
    }));
  }

  function resetSmartTextResults(message = "Image changed. Analyze again to refresh detected text.") {
    smartTextWords = [];
    smartTextMatches = [];
    smartTextRevision = null;
    elements.smartTextSearch.hidden = true;
    elements.smartTextMatchList.replaceChildren();
    elements.smartTextMatchCount.textContent = "Enter text to find matches";
    elements.smartTextToggleMatches.disabled = true;
    setSmartTextStatus(message, { progress: 0 });
    syncSmartTextApplyState();
    render();
  }

  function ensureSmartTextAnalysisIsFresh() {
    if (smartTextRevision !== null && smartTextRevision !== documentRevision) resetSmartTextResults();
  }

  async function analyzeSmartText() {
    if (!imageLoaded || smartTextAnalyzing) return;
    smartTextAnalyzing = true;
    smartTextWords = [];
    smartTextMatches = [];
    elements.smartTextSearch.hidden = true;
    elements.analyzeTextButton.disabled = true;
    elements.analyzeTextButton.lastElementChild.textContent = "Analyzing…";
    setSmartTextStatus("Loading local OCR…", { progress: 0 });
    renderSmartTextMatches();
    const analyzedRevision = documentRevision;

    try {
      const worker = await getOcrWorker();
      const input = ocrInputCanvas();
      const result = await worker.recognize(input.canvas, {}, { blocks: true });
      if (documentRevision !== analyzedRevision) throw new Error("The image changed during OCR. Analyze it again.");
      smartTextWords = scaleOcrWords(extractOcrWords(result.data), input.scale);
      smartTextRevision = documentRevision;
      elements.smartTextSearch.hidden = false;
      setSmartTextStatus(
        smartTextWords.length
          ? `Found ${smartTextWords.length} text ${smartTextWords.length === 1 ? "word" : "words"}. Search below to preview matches.`
          : "No readable text was found in this image.",
        { progress: 1 },
      );
      updateSmartTextMatches();
      if (smartTextWords.length) elements.smartTextQuery.focus({ preventScroll: true });
    } catch (error) {
      resetSmartTextResults(error?.message || "Text analysis failed. Try again.");
    } finally {
      smartTextAnalyzing = false;
      elements.analyzeTextButton.disabled = !imageLoaded;
      elements.analyzeTextButton.lastElementChild.textContent = smartTextWords.length ? "Analyze again" : "Analyze image text";
      syncSmartTextApplyState();
    }
  }

  function selectedSmartTextMatches() {
    return smartTextMatches.filter((match) => match.selected);
  }

  function smartTextActionCopy(action = smartTextAction) {
    return {
      remove: { label: "Remove", past: "Removed", note: "Samples the nearby background to cleanly cover the detected text." },
      blur: { label: "Blur", past: "Blurred", note: "Obscures detected text with an editable Gaussian blur or pixelation." },
      mask: { label: "Mask", past: "Masked", note: "Covers detected text with your chosen color and fill pattern." },
      replace: { label: "Replace", past: "Replaced", note: "Samples the colors and previews replacement typography before applying." },
    }[action] || { label: "Remove", past: "Removed", note: "" };
  }

  function updateSmartTextOptionUI() {
    elements.smartTextBlurOptions.hidden = smartTextAction !== "blur";
    elements.smartTextMaskOptions.hidden = smartTextAction !== "mask";
    elements.smartTextReplaceOptions.hidden = smartTextAction !== "replace";
    elements.smartTextActionNote.textContent = smartTextActionCopy().note;
    elements.smartTextFont.value = smartTextFont;
    elements.smartTextWeight.value = smartTextWeight;
    elements.smartTextSizeScale.value = String(smartTextSizeScale);
    elements.smartTextSizeScaleValue.value = `${smartTextSizeScale}%`;
    elements.smartTextRotation.value = String(smartTextRotation);
    elements.smartTextRotationValue.value = `${smartTextRotation}°`;
    elements.smartTextBlurStrength.value = String(smartTextBlurStrength);
    elements.smartTextBlurStrengthValue.value = smartTextBlurStyle === "pixelize"
      ? `${smartTextBlurStrength} px`
      : String(smartTextBlurStrength);
    elements.smartTextBlurStyleButtons.forEach((button) => {
      const active = button.dataset.smartBlurStyle === smartTextBlurStyle;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.smartTextMaskColorValue.value = elements.smartTextMaskColor.value.toUpperCase();
    const lineColor = getPatternLineColor(elements.smartTextMaskColor.value, 0.32);
    elements.smartTextMaskPatternButtons.forEach((button) => {
      const active = button.dataset.smartMaskPattern === smartTextMaskPattern;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.style.setProperty("--sample-color", elements.smartTextMaskColor.value);
      button.style.setProperty("--sample-line", lineColor);
    });
  }

  function syncSmartTextApplyState() {
    const count = selectedSmartTextMatches().length;
    const actionLabel = smartTextActionCopy().label;
    elements.applySmartTextButtonLabel.textContent = count
      ? `${actionLabel} ${count} selected`
      : `${actionLabel} selected`;
    elements.applySmartTextButton.disabled = smartTextAnalyzing
      || count === 0
      || smartTextRevision !== documentRevision
      || (smartTextAction === "replace" && !elements.smartTextReplacement.value.trim());
    const allSelected = smartTextMatches.length > 0 && count === smartTextMatches.length;
    elements.smartTextToggleMatches.textContent = allSelected ? "Clear all" : "Select all";
    elements.smartTextToggleMatches.disabled = smartTextMatches.length === 0;
  }

  function smartTextAppearance(match) {
    return match.appearance || {
      backgroundColor: "#ffffff",
      textColor: "#14213d",
      foregroundCoverage: 0,
      padding: Math.max(2, Math.round((match.bbox.y1 - match.bbox.y0) * 0.16)),
    };
  }

  function smartTextResolvedStyle(match) {
    const appearance = smartTextAppearance(match);
    const requestedFont = match.fontOverride || smartTextFont;
    const requestedWeight = match.weightOverride || smartTextWeight;
    const family = requestedFont === "auto" ? inferFontFamily(match.fontName) : requestedFont;
    const weight = requestedWeight === "auto"
      ? inferFontWeight(match.fontName, appearance.foregroundCoverage)
      : requestedWeight;
    const scale = clampNumber(match.sizeScaleOverride ?? smartTextSizeScale, 1, 200, 100);
    const rotation = clampNumber(match.rotationOverride ?? smartTextRotation, -180, 180, 0);
    const sourceHeight = Math.max(1, match.bbox.y1 - match.bbox.y0);
    const probeSize = 100;
    baseContext.save();
    baseContext.font = `${weight === "bold" ? 700 : 400} ${probeSize}px ${fontFamilyFor(family)}`;
    const metrics = baseContext.measureText(match.text || "Ag");
    baseContext.restore();
    const probeInkHeight = Math.max(1, (metrics.actualBoundingBoxAscent || probeSize * 0.72)
      + (metrics.actualBoundingBoxDescent || probeSize * 0.2));
    const fontSize = Math.max(0.5, Math.min(160, (sourceHeight * probeSize / probeInkHeight) * scale / 100));
    return { family, weight, scale, rotation, fontSize };
  }

  function smartTextStyleSummary(match) {
    const style = smartTextResolvedStyle(match);
    const size = style.fontSize < 10 ? style.fontSize.toFixed(1) : Math.round(style.fontSize);
    return `${TEXT_FONTS[style.family]?.label || "Sans"} · ${style.weight === "bold" ? "Bold" : "Normal"} · ${size} px · ${style.rotation}°`;
  }

  function createSmartTextMatchAdjustment(match, summary) {
    const adjustment = document.createElement("div");
    adjustment.className = "smart-text-match-adjustment";
    adjustment.hidden = !match.tuningOpen;

    const weightLabel = document.createElement("label");
    weightLabel.className = "smart-text-match-weight";
    const weightTitle = document.createElement("span");
    weightTitle.textContent = "Weight";
    const weightSelect = document.createElement("select");
    [
      ["", "Use default"],
      ["auto", "Auto detect"],
      ["normal", "Normal"],
      ["bold", "Bold"],
    ].forEach(([value, label]) => weightSelect.add(new Option(label, value)));
    weightSelect.value = match.weightOverride || "";
    weightSelect.addEventListener("change", () => {
      match.weightOverride = weightSelect.value || null;
      summary.textContent = smartTextStyleSummary(match);
      render();
    });
    weightLabel.append(weightTitle, weightSelect);

    const sizeLabel = document.createElement("label");
    sizeLabel.className = "smart-text-match-size";
    const sizeHeading = document.createElement("span");
    sizeHeading.textContent = "Size";
    const sizeValue = document.createElement("output");
    const currentScale = clampNumber(match.sizeScaleOverride ?? smartTextSizeScale, 1, 200, 100);
    sizeValue.value = `${currentScale}%`;
    sizeHeading.append(sizeValue);
    const sizeInput = document.createElement("input");
    sizeInput.type = "range";
    sizeInput.min = "1";
    sizeInput.max = "200";
    sizeInput.step = "1";
    sizeInput.value = String(currentScale);
    sizeInput.addEventListener("input", () => {
      match.sizeScaleOverride = Number(sizeInput.value);
      sizeValue.value = `${sizeInput.value}%`;
      summary.textContent = smartTextStyleSummary(match);
      render();
    });
    sizeLabel.append(sizeHeading, sizeInput);

    const rotationLabel = document.createElement("label");
    rotationLabel.className = "smart-text-match-size";
    const rotationHeading = document.createElement("span");
    rotationHeading.textContent = "Rotation";
    const rotationValue = document.createElement("output");
    const currentRotation = clampNumber(match.rotationOverride ?? smartTextRotation, -180, 180, 0);
    rotationValue.value = `${currentRotation}°`;
    rotationHeading.append(rotationValue);
    const rotationInput = document.createElement("input");
    rotationInput.type = "range";
    rotationInput.min = "-180";
    rotationInput.max = "180";
    rotationInput.step = "1";
    rotationInput.value = String(currentRotation);
    rotationInput.addEventListener("input", () => {
      match.rotationOverride = Number(rotationInput.value);
      rotationValue.value = `${rotationInput.value}°`;
      summary.textContent = smartTextStyleSummary(match);
      render();
    });
    rotationLabel.append(rotationHeading, rotationInput);

    const reset = document.createElement("button");
    reset.className = "text-button smart-text-match-reset";
    reset.type = "button";
    reset.textContent = "Use defaults";
    reset.addEventListener("click", () => {
      match.weightOverride = null;
      match.sizeScaleOverride = null;
      match.rotationOverride = null;
      renderSmartTextMatches();
    });
    adjustment.append(weightLabel, sizeLabel, rotationLabel, reset);
    return adjustment;
  }

  function renderSmartTextMatches() {
    elements.smartTextMatchList.replaceChildren();
    smartTextMatches.forEach((match) => {
      const card = document.createElement("div");
      card.className = "smart-text-match-card";
      const row = document.createElement("div");
      row.className = "smart-text-match";
      const label = document.createElement("label");
      label.className = "smart-text-match-select";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = match.selected;
      checkbox.addEventListener("change", () => {
        match.selected = checkbox.checked;
        syncSmartTextApplyState();
        render();
      });
      const text = document.createElement("span");
      text.textContent = match.text;
      const confidence = document.createElement("small");
      confidence.textContent = `${Math.round(match.confidence)}%`;
      label.append(checkbox, text, confidence);
      row.append(label);
      if (smartTextAction === "replace") {
        const summary = document.createElement("small");
        summary.className = "smart-text-match-summary";
        summary.textContent = smartTextStyleSummary(match);
        const adjust = document.createElement("button");
        adjust.className = "text-button smart-text-match-adjust";
        adjust.type = "button";
        adjust.textContent = match.tuningOpen ? "Done" : "Adjust";
        adjust.setAttribute("aria-expanded", String(Boolean(match.tuningOpen)));
        adjust.addEventListener("click", () => {
          match.tuningOpen = !match.tuningOpen;
          renderSmartTextMatches();
        });
        row.append(summary, adjust);
        card.append(row, createSmartTextMatchAdjustment(match, summary));
      } else {
        card.append(row);
      }
      elements.smartTextMatchList.append(card);
    });
    const count = smartTextMatches.length;
    elements.smartTextMatchCount.textContent = elements.smartTextQuery.value.trim()
      ? `${count} ${count === 1 ? "match" : "matches"}`
      : "Enter text to find matches";
    syncSmartTextApplyState();
    render();
  }

  function updateSmartTextMatches() {
    ensureSmartTextAnalysisIsFresh();
    if (!smartTextWords.length || smartTextRevision !== documentRevision) {
      smartTextMatches = [];
      renderSmartTextMatches();
      return;
    }
    let imageData = null;
    try {
      imageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
    } catch {
      imageData = null;
    }
    smartTextMatches = findPhraseMatches(smartTextWords, elements.smartTextQuery.value, {
      caseSensitive: elements.smartTextCaseSensitive.checked,
      wholeWord: elements.smartTextWholeWord.checked,
    }).map((match) => ({
      ...match,
      selected: true,
      appearance: imageData ? estimatePatchAppearance(imageData, match.bbox) : null,
      tuningOpen: false,
      weightOverride: null,
      sizeScaleOverride: null,
      rotationOverride: null,
    }));
    renderSmartTextMatches();
  }

  function setSmartTextAction(action) {
    smartTextAction = ["remove", "blur", "mask", "replace"].includes(action) ? action : "remove";
    elements.smartTextActionButtons.forEach((button) => {
      const active = button.dataset.smartAction === smartTextAction;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateSmartTextOptionUI();
    renderSmartTextMatches();
  }

  function smartTextObject(match, { createId = true } = {}) {
    const appearance = smartTextAppearance(match);
    const previewPadding = smartTextAction === "blur" ? Math.max(1, Math.round(appearance.padding * 0.55)) : appearance.padding;
    let bounds = paddedBounds(
      match.bbox,
      previewPadding,
      baseCanvas.width,
      baseCanvas.height,
    );
    if (smartTextAction === "blur") {
      return {
        id: createId ? createObjectId() : null,
        mode: "blur",
        blurStyle: smartTextBlurStyle,
        blurStrength: smartTextBlurStrength,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
    }
    const replacing = smartTextAction === "replace";
    const style = smartTextResolvedStyle(match);
    const replacement = replacing ? elements.smartTextReplacement.value.trim() : "";
    let baselineY = match.baseline
      ? (Number(match.baseline.y0) + Number(match.baseline.y1)) / 2
      : match.bbox.y1;
    let textStartX = match.bbox.x0;
    if (replacing && replacement) {
      baseContext.save();
      baseContext.font = `${style.weight === "bold" ? 700 : 400} ${style.fontSize}px ${fontFamilyFor(style.family)}`;
      const textMetrics = baseContext.measureText(replacement);
      baseContext.restore();
      const measuredWidth = textMetrics.width;
      const textPadding = Math.max(1, appearance.padding);
      const desiredWidth = Math.min(baseCanvas.width, Math.ceil(measuredWidth + textPadding * 2));
      if (desiredWidth > bounds.width) {
        const extra = desiredWidth - bounds.width;
        const growRight = Math.min(extra, baseCanvas.width - bounds.x - bounds.width);
        const growLeft = Math.min(extra - growRight, bounds.x);
        bounds = { ...bounds, x: bounds.x - growLeft, width: bounds.width + growRight + growLeft };
      }
      textStartX = Math.max(
        bounds.x + textPadding,
        Math.min(match.bbox.x0, bounds.x + bounds.width - measuredWidth - textPadding),
      );
      const verticalPadding = Math.max(1, Math.min(appearance.padding, style.fontSize * 0.18));
      const fittedBounds = fitTextVerticalBounds(
        bounds,
        baselineY,
        textMetrics.actualBoundingBoxAscent || style.fontSize * 0.8,
        textMetrics.actualBoundingBoxDescent || style.fontSize * 0.24,
        verticalPadding,
        baseCanvas.height,
      );
      bounds = fittedBounds;
      baselineY = fittedBounds.baselineY;
    }
    return {
      id: createId ? createObjectId() : null,
      mode: replacing ? "text" : "mask",
      pattern: smartTextAction === "mask" ? smartTextMaskPattern : "solid",
      backgroundColor: smartTextAction === "mask" ? elements.smartTextMaskColor.value : appearance.backgroundColor,
      text: replacement,
      textColor: appearance.textColor,
      textFont: style.family,
      textStyle: style.weight,
      fontSize: style.fontSize,
      autoTextSize: false,
      scaleTextOnResize: replacing,
      textInsetRatio: Math.max(0, (textStartX - bounds.x) / Math.max(1, bounds.width)),
      textBaselineRatio: Math.max(0, Math.min(1, (baselineY - bounds.y) / Math.max(1, bounds.height))),
      rotation: replacing ? style.rotation : 0,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      patternSpacing: 9,
      patternLineWidth: 1.5,
    };
  }

  function applySmartTextMatches() {
    ensureSmartTextAnalysisIsFresh();
    const matches = selectedSmartTextMatches();
    if (!matches.length || elements.applySmartTextButton.disabled) return;
    const createdObjects = matches.map((match) => smartTextObject(match));
    rememberHistoryStep();
    placedObjects.push(...createdObjects);
    clearSelectedObjects();
    selection = null;
    rebuildBaseCanvas();
    const action = smartTextActionCopy().past;
    smartTextWords = [];
    smartTextMatches = [];
    smartTextRevision = null;
    elements.smartTextSearch.hidden = true;
    setSmartTextStatus(`${action} ${matches.length} ${matches.length === 1 ? "match" : "matches"}. Analyze again to find more text.`, { progress: 1 });
    elements.analyzeTextButton.lastElementChild.textContent = "Analyze again";
    renderSmartTextMatches();
    updateControls();
    render();
    scheduleCurrentImageSave();
    if (smartTextAction === "replace" && createdObjects.length) {
      selectPlacedObject(createdObjects[0]);
      selectedObjectIds = new Set(createdObjects.map((object) => object.id));
      activeObjectId = createdObjects[0].id;
      syncSelectionFromActiveObject();
      updateControls();
      render();
      showToast(`${action} ${matches.length} text ${matches.length === 1 ? "match" : "matches"}. Replacements are selected; Shift-click to adjust the group.`);
    } else {
      showToast(`${action} ${matches.length} text ${matches.length === 1 ? "match" : "matches"}.`);
    }
  }

  function drawSmartTextPreview(targetContext, { drawObjects = true } = {}) {
    if (mode !== "smart" || smartTextRevision !== documentRevision || !smartTextMatches.length) return;
    const displayScale = toolDisplayScale();
    if (drawObjects) selectedSmartTextMatches().forEach((match) => drawPlacedObject(targetContext, smartTextObject(match, { createId: false })));
    targetContext.save();
    targetContext.strokeStyle = "#2f6fed";
    targetContext.lineWidth = Math.max(1, 1.5 * displayScale);
    targetContext.setLineDash([4 * displayScale, 3 * displayScale]);
    selectedSmartTextMatches().forEach((match) => {
      const object = smartTextObject(match, { createId: false });
      targetContext.save();
      if (object.rotation) {
        const center = rectangularObjectCenter(object);
        targetContext.translate(center.x, center.y);
        targetContext.rotate(objectRotationRadians(object));
        targetContext.translate(-center.x, -center.y);
      }
      targetContext.strokeRect(object.x, object.y, object.width, object.height);
      targetContext.restore();
    });
    targetContext.restore();
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

  function fontFamilyFor(font = textFont) {
    return (TEXT_FONTS[font] || TEXT_FONTS.sans).family;
  }

  function canvasFont(size) {
    const weight = textStyle === "bold" ? 700 : 400;
    const italic = textStyle === "italic" ? "italic " : "";
    return `${italic}${weight} ${size}px ${fontFamilyFor()}`;
  }

  function setTextFont(nextFont, remember = true) {
    textFont = TEXT_FONTS[nextFont] ? nextFont : "sans";
    elements.textFontButtons.forEach((button) => {
      const isActive = button.dataset.textFont === textFont;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (remember) savePreference(STORAGE_KEYS.textFont, textFont);
    if (remember) captureToolSettings(mode);
    updateFontSizeUI();
    syncActiveObjectFromControls();
    render();
  }

  function setTextStyle(nextStyle, remember = true) {
    textStyle = ["normal", "bold", "italic"].includes(nextStyle) ? nextStyle : "bold";
    elements.textStyleButtons.forEach((button) => {
      const isActive = button.dataset.textStyle === textStyle;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (remember) savePreference(STORAGE_KEYS.textStyle, textStyle);
    if (remember) captureToolSettings(mode);
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
    elements.annotationRoughnessField.hidden = annotationStyle !== "hand";
    if (remember) savePreference(STORAGE_KEYS.annotationStyle, annotationStyle);
    if (remember) captureToolSettings(mode);
    syncActiveObjectFromControls();
    render();
  }

  function roughnessLabel(value = annotationRoughness) {
    return ROUGHNESS_LABELS[clampNumber(value, 1, 5, 3)];
  }

  function setAnnotationRoughness(nextRoughness, remember = true) {
    annotationRoughness = clampNumber(nextRoughness, 1, 5, 3);
    elements.annotationRoughness.value = String(annotationRoughness);
    elements.annotationRoughnessValue.value = roughnessLabel();
    if (remember) savePreference(STORAGE_KEYS.annotationRoughness, String(annotationRoughness));
    if (remember) captureToolSettings(mode);
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
    if (remember) captureToolSettings(mode);
    syncActiveObjectFromControls();
    render();
  }

  function loadRecentPatches() {
    try {
      const saved = JSON.parse(readPreference(STORAGE_KEYS.recentPatches, "[]"));
      const normalizedPatches = Array.isArray(saved)
        ? saved
            .filter((preset) => preset && ["mask", "blur", "text", "circle", "arrow", "line"].includes(preset.mode))
            .map((preset) => ({
              mode: preset.mode,
              pattern: ["solid", "diagonal", "hatch"].includes(preset.pattern) ? preset.pattern : "solid",
              backgroundColor: preset.backgroundColor || "#111827",
              text: preset.mode === "text" ? String(preset.text || "").trim() : "",
              textColor: preset.textColor || "#ffffff",
              textFont: TEXT_FONTS[preset.textFont] ? preset.textFont : "sans",
              fontSize: Number(preset.fontSize) || 28,
              autoTextSize: preset.autoTextSize === true,
              textStyle: ["normal", "bold", "italic"].includes(preset.textStyle) ? preset.textStyle : "bold",
              annotationColor: preset.annotationColor || "#ef4444",
              annotationSize: clampNumber(preset.annotationSize, 2, 28, 6),
              annotationStyle: ["clean", "hand"].includes(preset.annotationStyle) ? preset.annotationStyle : "clean",
              annotationRoughness: clampNumber(preset.annotationRoughness, 1, 5, 3),
              blurStyle: ["gaussian", "pixelize"].includes(preset.blurStyle) ? preset.blurStyle : "gaussian",
              blurStrength: clampNumber(preset.blurStrength, 2, 40, 14),
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
      textFont,
      textStyle,
      fontSize: Number(elements.fontSize.value),
      autoTextSize: elements.autoTextSize.checked,
      annotationColor: elements.annotationColor.value,
      annotationSize: Number(elements.annotationSize.value),
      annotationStyle,
      annotationRoughness,
      blurStyle,
      blurStrength,
    };
  }

  function presetKey(preset) {
    if (preset.mode === "mask") {
      return JSON.stringify([preset.mode, preset.pattern, preset.backgroundColor]);
    }
    if (preset.mode === "blur") {
      return JSON.stringify([preset.mode, preset.blurStyle, preset.blurStrength]);
    }
    if (["circle", "arrow", "line"].includes(preset.mode)) {
      return JSON.stringify([
        preset.mode,
        preset.annotationColor,
        preset.annotationSize,
        preset.annotationStyle,
        preset.annotationStyle === "hand" ? preset.annotationRoughness : null,
      ]);
    }
    return JSON.stringify([
      preset.mode,
      preset.pattern,
      preset.backgroundColor,
      preset.text,
      preset.textColor,
      preset.textFont,
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
        : preset.mode === "blur"
          ? `${capitalize(preset.blurStyle || "gaussian")} blur`
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
        : preset.mode === "blur"
          ? "▦"
        : isAnnotation
          ? ({ circle: "○", arrow: "↗", line: "╱" }[preset.mode])
          : "";
      if (preset.mode === "text") {
        swatch.style.fontFamily = fontFamilyFor(preset.textFont);
        swatch.style.fontStyle = preset.textStyle === "italic" ? "italic" : "normal";
        swatch.style.fontWeight = preset.textStyle === "bold" ? "700" : "400";
      } else if (preset.mode === "blur") {
        swatch.style.background = "linear-gradient(135deg, #94a3b8, #e2e8f0)";
        swatch.style.color = "#14213d";
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
        ? `${(preset.annotationColor || "#ef4444").toUpperCase()} · ${preset.annotationSize || 6} px · ${preset.annotationStyle === "hand" ? `Hand drawn · ${roughnessLabel(preset.annotationRoughness)}` : "Clean"}`
        : preset.mode === "text"
          ? `${(TEXT_FONTS[preset.textFont] || TEXT_FONTS.sans).label} · ${preset.autoTextSize ? "Auto" : `${preset.fontSize || 28} px`} · ${capitalize(preset.textStyle || "bold")}`
          : preset.mode === "blur"
            ? `${capitalize(preset.blurStyle || "gaussian")} · strength ${preset.blurStrength || 14}`
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
    clearSelectedObjects();
    activeImageLayerId = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    rememberPreset(preset);
    if (preset.mode === "mask") {
      toolSettings.mask = { backgroundColor: preset.backgroundColor || "#111827", pattern: preset.pattern || "solid" };
    } else if (preset.mode === "text") {
      toolSettings.text = {
        backgroundColor: preset.backgroundColor || "#111827",
        pattern: preset.pattern || "solid",
        text: preset.text || "",
        textColor: preset.textColor || "#ffffff",
        textFont: TEXT_FONTS[preset.textFont] ? preset.textFont : "sans",
        textStyle: preset.textStyle || "bold",
        fontSize: preset.fontSize || 28,
        autoTextSize: preset.autoTextSize === true,
      };
    } else if (preset.mode === "blur") {
      toolSettings.blur = {
        blurStyle: ["gaussian", "pixelize"].includes(preset.blurStyle) ? preset.blurStyle : "gaussian",
        blurStrength: clampNumber(preset.blurStrength, 2, 40, 14),
      };
    } else if (["circle", "arrow", "line"].includes(preset.mode)) {
      toolSettings[preset.mode] = {
        annotationColor: preset.annotationColor || "#ef4444",
        annotationSize: preset.annotationSize || 6,
        annotationStyle: preset.annotationStyle || "clean",
        annotationRoughness: preset.annotationRoughness || 3,
      };
    }
    saveToolSettings();
    setMode(preset.mode || "mask");
    showToast("Recent tool loaded. Drag to place it.");
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
    elements.framePreview.classList.remove("has-reflection");

    if (!frameEnabled) {
      elements.framePreview.classList.remove("shows-transparency");
      elements.framePreview.classList.remove("is-zero-padding");
      elements.framePreview.style.removeProperty("width");
      elements.framePreview.style.removeProperty("height");
      elements.framePreview.style.removeProperty("padding");
      elements.framePreview.style.removeProperty("background");
      if (canvas.width !== documentWidth()) canvas.width = documentWidth();
      if (canvas.height !== documentHeight()) canvas.height = documentHeight();
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
      canvas.style.removeProperty("border-radius");
      canvas.style.removeProperty("margin-bottom");
      const selectedLayer = activeImageLayer();
      if (selectedLayer) selection = imageLayerBounds(selectedLayer);
      updateImageMeta();
      renderLayers();
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
    const transparentBackground = frameBackgroundIsTransparent();
    const zeroPadding = !shareHasBackgroundArea();

    elements.framePreview.style.width = `${previewWidth}px`;
    elements.framePreview.style.height = `${previewHeight}px`;
    elements.framePreview.style.padding = "0";
    elements.framePreview.classList.toggle("shows-transparency", transparentBackground);
    elements.framePreview.classList.toggle("is-zero-padding", zeroPadding);
    elements.framePreview.style.removeProperty("background");
    if (canvas.width !== dimensions.width) canvas.width = dimensions.width;
    if (canvas.height !== dimensions.height) canvas.height = dimensions.height;
    canvas.style.width = `${previewWidth}px`;
    canvas.style.height = `${previewHeight}px`;
    canvas.style.borderRadius = "0";
    canvas.style.marginBottom = "0";
    const selectedLayer = activeImageLayer();
    if (selectedLayer) selection = imageLayerBounds(selectedLayer);
    updateImageMeta();
    renderLayers();
    updateViewTransform();
    window.requestAnimationFrame(render);
  }

  function isImageFile(file) {
    return Boolean(file && file.type.startsWith("image/"));
  }

  function chooseFile(intent = "replace") {
    filePickerIntent = intent;
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

  function createImageLayer(image, blob, name, placement = {}) {
    return {
      id: placement.id || createObjectId(),
      name: name || "Image layer",
      blob,
      image,
      x: Number.isFinite(placement.x) ? placement.x : 0,
      y: Number.isFinite(placement.y) ? placement.y : 0,
      width: Number.isFinite(placement.width) ? placement.width : image.naturalWidth,
      height: Number.isFinite(placement.height) ? placement.height : image.naturalHeight,
      visible: placement.visible !== false,
      edgeStyle: ["none", "solid", "gradient"].includes(placement.edgeStyle)
        ? placement.edgeStyle
        : screenshotEdgeDefaults.edgeStyle,
      edgeColor: placement.edgeColor || screenshotEdgeDefaults.edgeColor,
      edgeGradient: GRADIENTS[placement.edgeGradient] ? placement.edgeGradient : screenshotEdgeDefaults.edgeGradient,
      edgeWidth: clampNumber(placement.edgeWidth, 1, 16, screenshotEdgeDefaults.edgeWidth),
      edgeGlow: clampNumber(placement.edgeGlow, 0, 48, screenshotEdgeDefaults.edgeGlow),
    };
  }

  function activateDocument({ width, height, layers, id, label, name, objects = [] }) {
    canvas.width = width;
    canvas.height = height;
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    baseCanvas.width = width;
    baseCanvas.height = height;
    imageLayers = cloneImageLayers(layers);
    placedObjects = clonePlacedObjects(objects);
    clearSelectedObjects();
    activeImageLayerId = null;
    rebuildBaseCanvas();

    imageLoaded = true;
    currentImageId = id;
    imageLabel = label || "Pasted image";
    imageName = name || "pasted-image";
    selection = null;
    selectionInteraction = null;
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
    elements.newCanvasButton.disabled = false;
    elements.addLayerButton.disabled = false;
    elements.canvasTextAddButton.disabled = !frameEnabled || !elements.canvasTextContent.value.trim();
    elements.copyButton.disabled = false;
    elements.downloadButton.disabled = false;
    elements.workspaceTip.textContent = "Drag to place · click an item to edit";
    renderLayers();
    updateControls();
    updatePresentationUI();
    render();
    canvas.focus({ preventScroll: true });
  }

  async function startNewCanvas() {
    if (isSwitchingImages || !imageLoaded) return;
    isSwitchingImages = true;
    elements.newCanvasButton.disabled = true;
    const saved = await saveCurrentImage({ notifyFailure: true });
    if (!saved) {
      isSwitchingImages = false;
      elements.newCanvasButton.disabled = false;
      showToast("Current image could not be saved, so the canvas was left open.");
      return;
    }

    commitPendingSettingsHistory();
    imageLoaded = false;
    currentImageId = null;
    imageLabel = "Pasted image";
    imageName = "pasted-image";
    imageLayers = [];
    placedObjects = [];
    clearSelectedObjects();
    activeImageLayerId = null;
    selection = null;
    selectionInteraction = null;
    imageLayerInteraction = null;
    objectInteraction = null;
    arrowStart = null;
    arrowEnd = null;
    history = [];
    future = [];
    panModeEnabled = false;
    viewZoom = 1;
    viewPanX = 0;
    viewPanY = 0;

    canvas.width = 1;
    canvas.height = 1;
    sourceCanvas.width = 1;
    sourceCanvas.height = 1;
    baseCanvas.width = 1;
    baseCanvas.height = 1;
    elements.emptyState.hidden = false;
    elements.framePreview.hidden = true;
    canvas.hidden = true;
    canvas.removeAttribute("tabindex");
    elements.editControls.setAttribute("aria-disabled", "true");
    elements.addLayerButton.disabled = true;
    elements.canvasTextAddButton.disabled = true;
    elements.copyButton.disabled = true;
    elements.downloadButton.disabled = true;
    elements.imageMeta.textContent = "No image loaded";
    elements.workspaceTip.textContent = "Paste anywhere to begin";
    elements.layersEmpty.hidden = false;
    renderLayers();
    updatePresentationUI();
    updateViewTransform();
    updateControls();
    isSwitchingImages = false;
    renderRecentImages();
    showToast("New canvas ready. Paste, drop, or choose an image.");
    elements.emptyState.focus({ preventScroll: true });
  }

  function activateImage(image, { blob, id, label, name, objects = [] }) {
    const layer = createImageLayer(image, blob, label || name);
    activateDocument({
      width: image.naturalWidth,
      height: image.naturalHeight,
      layers: [layer],
      id,
      label,
      name,
      objects,
    });
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
      if (Array.isArray(record.layers) && record.layers.length) {
        const layers = await hydrateImageLayers(record.layers);
        activateDocument({
          width: record.width,
          height: record.height,
          layers,
          id: record.id,
          label: record.label,
          name: record.name,
          objects: Array.isArray(record.objects) ? record.objects : [],
        });
      } else {
        const hasEditableDocument = Boolean(record.sourceBlob && Array.isArray(record.objects));
        const blob = hasEditableDocument ? record.sourceBlob : record.blob;
        const image = await imageFromBlob(blob);
        if (!imageDimensionsAreValid(image)) throw new Error("The saved image is too large.");
        activateImage(image, {
          blob,
          id: record.id,
          label: record.label,
          name: record.name,
          objects: hasEditableDocument ? record.objects : [],
        });
      }
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

  async function addImageLayer(image, blob, name, { remember = true } = {}) {
    if (!imageLoaded) return;
    if (remember) rememberHistoryStep();
    const scale = Math.min((documentWidth() * 0.74) / image.naturalWidth, (documentHeight() * 0.74) / image.naturalHeight, 1);
    const width = Math.max(4, image.naturalWidth * scale);
    const height = Math.max(4, image.naturalHeight * scale);
    const layer = createImageLayer(image, blob, name, {
      x: (documentWidth() - width) / 2,
      y: (documentHeight() - height) / 2,
      width,
      height,
    });
    imageLayers.push(layer);
    activeImageLayerId = layer.id;
    clearSelectedObjects();
    selection = imageLayerBounds(layer);
    rebuildBaseCanvas();
    renderLayers();
    setMode("arrange", { preserveLayer: true });
    updateControls();
    render();
    scheduleCurrentImageSave();
  }

  async function loadImageFiles(files, { replace = false } = {}) {
    const imageFiles = [...files].filter(isImageFile);
    if (!imageFiles.length) {
      showToast("Choose a PNG, JPG, WebP, or GIF image.");
      return;
    }
    const decoded = [];
    try {
      for (const file of imageFiles) {
        const image = await imageFromBlob(file);
        if (!imageDimensionsAreValid(image)) throw new Error("large");
        decoded.push({ file, image });
      }
    } catch (error) {
      showToast(error.message === "large" ? "One of those images is too large. Use images under 48 megapixels." : "One of those images could not be opened.");
      return;
    }

    let startIndex = 0;
    if (replace || !imageLoaded) {
      await saveCurrentImage({ notifyFailure: true, refresh: false });
      const { file, image } = decoded[0];
      const label = file.name || "Pasted image";
      activateImage(image, {
        blob: file,
        id: createImageId(),
        label,
        name: (file.name || "pasted-image").replace(/\.[^.]+$/, ""),
      });
      startIndex = 1;
    }
    for (let index = startIndex; index < decoded.length; index += 1) {
      const { file, image } = decoded[index];
      await addImageLayer(image, file, file.name || `Image ${imageLayers.length + 1}`, { remember: true });
    }
    await saveCurrentImage({ notifyFailure: true });
    showToast(decoded.length > 1 || startIndex === 0 ? `${decoded.length} image${decoded.length === 1 ? "" : "s"} added as layers.` : "Image ready. Drag a box to start.");
  }

  function layerThumbnail(layer) {
    const thumbnail = document.createElement("canvas");
    thumbnail.width = 76;
    thumbnail.height = 68;
    const thumbnailContext = thumbnail.getContext("2d");
    thumbnailContext.fillStyle = "#ffffff";
    thumbnailContext.fillRect(0, 0, thumbnail.width, thumbnail.height);
    const scale = Math.min(thumbnail.width / layer.image.naturalWidth, thumbnail.height / layer.image.naturalHeight);
    const width = layer.image.naturalWidth * scale;
    const height = layer.image.naturalHeight * scale;
    thumbnailContext.drawImage(layer.image, (thumbnail.width - width) / 2, (thumbnail.height - height) / 2, width, height);
    return thumbnail.toDataURL("image/png");
  }

  function selectImageLayer(layer) {
    commitPendingSettingsHistory();
    clearSelectedObjects();
    activeImageLayerId = layer.id;
    selection = imageLayerBounds(layer);
    arrowStart = null;
    arrowEnd = null;
    setMode("arrange", { preserveLayer: true });
    renderLayers();
    updateScreenshotEdgeControls();
    updateControls();
    render();
    canvas.focus({ preventScroll: true });
  }

  function reorderImageLayer(layerId, direction) {
    const index = imageLayers.findIndex((layer) => layer.id === layerId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= imageLayers.length) return;
    rememberHistoryStep();
    [imageLayers[index], imageLayers[nextIndex]] = [imageLayers[nextIndex], imageLayers[index]];
    rebuildBaseCanvas();
    renderLayers();
    render();
    scheduleCurrentImageSave();
  }

  function deleteImageLayer(layerId) {
    if (imageLayers.length <= 1) {
      showToast("A document needs at least one image layer.");
      return;
    }
    rememberHistoryStep();
    imageLayers = imageLayers.filter((layer) => layer.id !== layerId);
    if (activeImageLayerId === layerId) {
      activeImageLayerId = imageLayers.at(-1)?.id || null;
    }
    const layer = activeImageLayer();
    selection = layer ? imageLayerBounds(layer) : null;
    rebuildBaseCanvas();
    renderLayers();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast("Image layer removed.");
  }

  function renderLayers() {
    elements.layersList.querySelectorAll(".image-layer-row, .canvas-text-layer-row").forEach((row) => row.remove());
    const canvasTextLayers = placedObjects.filter((object) => object.mode === "canvas-text");
    elements.layersEmpty.hidden = imageLayers.length > 0 || canvasTextLayers.length > 0;
    [...imageLayers].reverse().forEach((layer) => {
      const sourceIndex = imageLayers.findIndex((item) => item.id === layer.id);
      const row = document.createElement("div");
      row.className = "image-layer-row";
      row.classList.toggle("is-active", layer.id === activeImageLayerId);

      const select = document.createElement("button");
      select.type = "button";
      select.className = "image-layer-select";
      select.setAttribute("aria-label", `Select image layer ${layer.name}`);
      const thumbnail = document.createElement("img");
      thumbnail.className = "image-layer-thumb";
      thumbnail.src = layerThumbnail(layer);
      thumbnail.alt = "";
      const copy = document.createElement("span");
      copy.className = "image-layer-copy";
      const title = document.createElement("strong");
      title.textContent = layer.name || "Image layer";
      const detail = document.createElement("small");
      const bounds = imageLayerBounds(layer);
      detail.textContent = `${Math.round(bounds.width)} × ${Math.round(bounds.height)} px${frameEnabled ? " · share" : ""}`;
      copy.append(title, detail);
      select.append(thumbnail, copy);
      select.addEventListener("click", () => selectImageLayer(layer));

      const actions = document.createElement("span");
      actions.className = "layer-actions";
      const up = document.createElement("button");
      up.type = "button";
      up.className = "layer-action";
      up.textContent = "↑";
      up.title = "Move layer forward";
      up.disabled = sourceIndex === imageLayers.length - 1;
      up.addEventListener("click", () => reorderImageLayer(layer.id, 1));
      const down = document.createElement("button");
      down.type = "button";
      down.className = "layer-action";
      down.textContent = "↓";
      down.title = "Move layer backward";
      down.disabled = sourceIndex === 0;
      down.addEventListener("click", () => reorderImageLayer(layer.id, -1));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "layer-action";
      remove.textContent = "×";
      remove.title = "Remove layer";
      remove.disabled = imageLayers.length <= 1;
      remove.addEventListener("click", () => deleteImageLayer(layer.id));
      actions.append(up, down, remove);

      row.append(select, actions);
      elements.layersList.append(row);
    });

    [...canvasTextLayers].reverse().forEach((object) => {
      const row = document.createElement("div");
      row.className = "canvas-text-layer-row";
      row.classList.toggle("is-active", object.id === activeObjectId);

      const select = document.createElement("button");
      select.type = "button";
      select.className = "image-layer-select";
      select.setAttribute("aria-label", `Select canvas text ${object.text || "Untitled"}`);
      const thumbnail = document.createElement("span");
      thumbnail.className = "canvas-text-layer-thumb";
      thumbnail.classList.toggle("is-gradient", object.fillMode === "gradient");
      thumbnail.textContent = "Aa";
      const copy = document.createElement("span");
      copy.className = "image-layer-copy";
      const title = document.createElement("strong");
      title.textContent = object.text?.split("\n").find(Boolean) || "Canvas text";
      const detail = document.createElement("small");
      detail.textContent = `${object.fillMode === "gradient" ? "Gradient" : "Solid"} · ${Math.round(object.fontSize || 72)} px`;
      copy.append(title, detail);
      select.append(thumbnail, copy);
      select.addEventListener("click", () => selectPlacedObject(object));

      const actions = document.createElement("span");
      actions.className = "layer-actions";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "layer-action";
      remove.textContent = "×";
      remove.title = "Remove text layer";
      remove.addEventListener("click", () => {
        selectOnlyObject(object);
        deleteActiveObject();
        renderLayers();
      });
      actions.append(remove);
      row.append(select, actions);
      elements.layersList.append(row);
    });
  }

  function canvasOutputPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (event.clientX - bounds.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (event.clientY - bounds.top) * scaleY)),
    };
  }

  function canvasPoint(event) {
    const point = canvasOutputPoint(event);
    return frameEnabled && !["arrange", "canvas-text"].includes(mode) ? documentPointFromShare(point) : point;
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
    const outputTolerance = Math.max(4, 10 * canvas.width / Math.max(canvas.getBoundingClientRect().width, 1));
    if (frameEnabled && !["arrange", "canvas-text"].includes(mode)) return outputTolerance / shareContentTransform().scale;
    return outputTolerance;
  }

  function toolDisplayScale() {
    const outputScale = canvas.width / Math.max(canvas.getBoundingClientRect().width, 1);
    return frameEnabled && !["arrange", "canvas-text"].includes(mode) ? outputScale / shareContentTransform().scale : outputScale;
  }

  function distanceBetween(left, right) {
    return Math.hypot(right.x - left.x, right.y - left.y);
  }

  function objectRotationRadians(object) {
    return Number(object.rotation || 0) * Math.PI / 180;
  }

  function rectangularObjectCenter(object) {
    return { x: object.x + object.width / 2, y: object.y + object.height / 2 };
  }

  function rotatedPoint(point, center, radians) {
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const deltaX = point.x - center.x;
    const deltaY = point.y - center.y;
    return {
      x: center.x + deltaX * cosine - deltaY * sine,
      y: center.y + deltaX * sine + deltaY * cosine,
    };
  }

  function rectangularObjectHandles(object) {
    const center = rectangularObjectCenter(object);
    const radians = objectRotationRadians(object);
    const points = {
      nw: { x: object.x, y: object.y },
      ne: { x: object.x + object.width, y: object.y },
      se: { x: object.x + object.width, y: object.y + object.height },
      sw: { x: object.x, y: object.y + object.height },
    };
    Object.keys(points).forEach((key) => { points[key] = rotatedPoint(points[key], center, radians); });
    const topMiddle = rotatedPoint({ x: center.x, y: object.y }, center, radians);
    const rotationDistance = Math.max(18, 24 * toolDisplayScale());
    points.rotate = {
      x: topMiddle.x + Math.sin(radians) * rotationDistance,
      y: topMiddle.y - Math.cos(radians) * rotationDistance,
    };
    points.topMiddle = topMiddle;
    return points;
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
    const localPoint = object.rotation
      ? rotatedPoint(point, rectangularObjectCenter(object), -objectRotationRadians(object))
      : point;
    return localPoint.x >= bounds.x && localPoint.x <= bounds.x + bounds.width
      && localPoint.y >= bounds.y && localPoint.y <= bounds.y + bounds.height;
  }

  function findObjectAtPoint(point, requestedSpace = null) {
    const shareSpace = requestedSpace === "share" || (!requestedSpace && frameEnabled && mode === "canvas-text");
    for (let index = placedObjects.length - 1; index >= 0; index -= 1) {
      const object = placedObjects[index];
      if ((object.mode === "canvas-text") !== shareSpace) continue;
      if (objectContainsPoint(object, point)) return object;
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
    const points = rectangularObjectHandles(object);
    const handles = ["nw", "ne", "se", "sw", "rotate"].map((handle) => [handle, points[handle]]);
    return handles.find(([, handlePoint]) => distanceBetween(point, handlePoint) <= tolerance)?.[0] || null;
  }

  function selectionHandleAtPoint(point) {
    if (!selection || activeObject()) return null;
    const tolerance = viewHitTolerance();
    if (["arrow", "line"].includes(mode)) {
      const { start, end } = resolvedArrowPoints();
      const handles = [["start", start], ["end", end]];
      return handles.find(([, handlePoint]) => distanceBetween(point, handlePoint) <= tolerance)?.[0] || null;
    }
    const handles = [
      ["nw", { x: selection.x, y: selection.y }],
      ["ne", { x: selection.x + selection.width, y: selection.y }],
      ["se", { x: selection.x + selection.width, y: selection.y + selection.height }],
      ["sw", { x: selection.x, y: selection.y + selection.height }],
    ];
    return handles.find(([, handlePoint]) => distanceBetween(point, handlePoint) <= tolerance)?.[0] || null;
  }

  function selectionContainsPoint(point) {
    if (!selection || activeObject()) return false;
    if (["arrow", "line"].includes(mode)) {
      const { start, end } = resolvedArrowPoints();
      return distanceToSegment(point, start, end) <= viewHitTolerance() + markerSize() / 2;
    }
    return point.x >= selection.x && point.x <= selection.x + selection.width
      && point.y >= selection.y && point.y <= selection.y + selection.height;
  }

  function imageLayerContainsPoint(layer, point) {
    const bounds = imageLayerBounds(layer);
    return point.x >= bounds.x && point.x <= bounds.x + bounds.width
      && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
  }

  function findImageLayerAtPoint(point) {
    return [...imageLayers].reverse().find((layer) => layer.visible !== false && imageLayerContainsPoint(layer, point)) || null;
  }

  function imageLayerHandleAtPoint(point) {
    const layer = activeImageLayer();
    if (!layer || mode !== "arrange") return null;
    const tolerance = viewHitTolerance();
    const bounds = imageLayerBounds(layer);
    const handles = [
      ["nw", { x: bounds.x, y: bounds.y }],
      ["ne", { x: bounds.x + bounds.width, y: bounds.y }],
      ["se", { x: bounds.x + bounds.width, y: bounds.y + bounds.height }],
      ["sw", { x: bounds.x, y: bounds.y + bounds.height }],
    ];
    return handles.find(([, handlePoint]) => distanceBetween(point, handlePoint) <= tolerance)?.[0] || null;
  }

  function beginImageLayerInteraction(layer, point, handle = null) {
    imageLayerInteraction = {
      layerId: layer.id,
      kind: handle ? "resize" : "move",
      handle,
      startPoint: { ...point },
      originalLayer: { ...layer },
      originalBounds: imageLayerBounds(layer),
      beforeSnapshot: null,
      changed: false,
    };
  }

  function resizeImageLayer(original, handle, point) {
    const opposite = {
      nw: { x: original.x + original.width, y: original.y + original.height },
      ne: { x: original.x, y: original.y + original.height },
      se: { x: original.x, y: original.y },
      sw: { x: original.x + original.width, y: original.y },
    }[handle];
    const proposedWidth = Math.max(20, Math.abs(point.x - opposite.x));
    const proposedHeight = Math.max(20, Math.abs(point.y - opposite.y));
    const ratio = original.width / original.height;
    let width;
    let height;
    if (proposedWidth / original.width >= proposedHeight / original.height) {
      width = proposedWidth;
      height = width / ratio;
    } else {
      height = proposedHeight;
      width = height * ratio;
    }
    return {
      ...original,
      x: handle.includes("w") ? opposite.x - width : opposite.x,
      y: handle.includes("n") ? opposite.y - height : opposite.y,
      width,
      height,
    };
  }

  function updateImageLayerInteraction(point) {
    if (!imageLayerInteraction) return;
    const index = imageLayers.findIndex((layer) => layer.id === imageLayerInteraction.layerId);
    if (index < 0) return;
    const original = imageLayerInteraction.originalBounds;
    let updated;
    if (imageLayerInteraction.kind === "resize") {
      updated = resizeImageLayer(original, imageLayerInteraction.handle, point);
    } else {
      const requestedX = original.x + point.x - imageLayerInteraction.startPoint.x;
      const requestedY = original.y + point.y - imageLayerInteraction.startPoint.y;
      const minimumVisible = Math.min(20, original.width, original.height);
      const boundsWidth = frameEnabled ? getOutputDimensions().width : documentWidth();
      const boundsHeight = frameEnabled ? getOutputDimensions().height : documentHeight();
      updated = {
        ...original,
        x: Math.max(-original.width + minimumVisible, Math.min(boundsWidth - minimumVisible, requestedX)),
        y: Math.max(-original.height + minimumVisible, Math.min(boundsHeight - minimumVisible, requestedY)),
      };
    }
    const changed = updated.x !== original.x || updated.y !== original.y || updated.width !== original.width || updated.height !== original.height;
    if (changed && !imageLayerInteraction.beforeSnapshot) imageLayerInteraction.beforeSnapshot = snapshot();
    imageLayerInteraction.changed = changed;
    const nextLayer = { ...imageLayerInteraction.originalLayer };
    if (frameEnabled) applyShareBoundsToLayer(nextLayer, updated);
    else Object.assign(nextLayer, updated);
    imageLayers[index] = nextLayer;
    selection = { x: updated.x, y: updated.y, width: updated.width, height: updated.height };
    rebuildBaseCanvas();
    updateControls();
    render();
  }

  function finishImageLayerInteraction() {
    if (!imageLayerInteraction) return;
    if (imageLayerInteraction.changed && imageLayerInteraction.beforeSnapshot) {
      history.push(imageLayerInteraction.beforeSnapshot);
      if (history.length > 12) history.shift();
      future = [];
      rebuildBaseCanvas();
      renderLayers();
      scheduleCurrentImageSave();
    }
    imageLayerInteraction = null;
    updateControls();
    render();
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
      kind: handle === "rotate" ? "rotate" : handle ? "resize" : "move",
      handle,
      startPoint: { ...point },
      original: { ...object },
      beforeSnapshot: null,
      changed: false,
    };
  }

  function beginSelectionInteraction(point, handle = null) {
    selectionInteraction = {
      kind: handle ? "resize" : "move",
      handle,
      startPoint: { ...point },
      originalSelection: { ...selection },
      originalArrowStart: arrowStart ? { ...arrowStart } : null,
      originalArrowEnd: arrowEnd ? { ...arrowEnd } : null,
    };
  }

  function boxForResize(original, handle, point) {
    const limits = original.mode === "canvas-text"
      ? getOutputDimensions()
      : { width: documentWidth(), height: documentHeight() };
    const opposite = {
      nw: { x: original.x + original.width, y: original.y + original.height },
      ne: { x: original.x, y: original.y + original.height },
      se: { x: original.x, y: original.y },
      sw: { x: original.x + original.width, y: original.y },
    }[handle];
    const constrained = {
      x: Math.max(0, Math.min(limits.width, point.x)),
      y: Math.max(0, Math.min(limits.height, point.y)),
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

  function rotatedBoxForResize(original, handle, point) {
    const points = rectangularObjectHandles(original);
    const oppositeHandle = { nw: "se", ne: "sw", se: "nw", sw: "ne" }[handle];
    const opposite = points[oppositeHandle];
    const radians = objectRotationRadians(original);
    const widthAxis = { x: Math.cos(radians), y: Math.sin(radians) };
    const heightAxis = { x: -Math.sin(radians), y: Math.cos(radians) };
    const delta = { x: point.x - opposite.x, y: point.y - opposite.y };
    const horizontalSign = handle.includes("e") ? 1 : -1;
    const verticalSign = handle.includes("s") ? 1 : -1;
    const width = Math.max(4, horizontalSign * (delta.x * widthAxis.x + delta.y * widthAxis.y));
    const height = Math.max(4, verticalSign * (delta.x * heightAxis.x + delta.y * heightAxis.y));
    const center = {
      x: opposite.x + widthAxis.x * horizontalSign * width / 2 + heightAxis.x * verticalSign * height / 2,
      y: opposite.y + widthAxis.y * horizontalSign * width / 2 + heightAxis.y * verticalSign * height / 2,
    };
    return { x: center.x - width / 2, y: center.y - height / 2, width, height };
  }

  function updateObjectInteraction(point) {
    if (!objectInteraction) return;
    const index = placedObjects.findIndex((object) => object.id === objectInteraction.objectId);
    if (index < 0) return;
    const original = objectInteraction.original;
    let updated = { ...original };

    if (objectInteraction.kind === "move") {
      const bounds = objectBounds(original);
      const limits = original.mode === "canvas-text"
        ? getOutputDimensions()
        : { width: documentWidth(), height: documentHeight() };
      const requestedX = point.x - objectInteraction.startPoint.x;
      const requestedY = point.y - objectInteraction.startPoint.y;
      const deltaX = Math.max(-bounds.x, Math.min(limits.width - bounds.x - bounds.width, requestedX));
      const deltaY = Math.max(-bounds.y, Math.min(limits.height - bounds.y - bounds.height, requestedY));
      updated = translatedObject(original, deltaX, deltaY);
    } else if (objectInteraction.kind === "rotate") {
      const center = rectangularObjectCenter(original);
      const degrees = Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI + 90;
      updated.rotation = Math.round(((degrees + 180) % 360 + 360) % 360 - 180);
    } else if (["arrow", "line"].includes(original.mode)) {
      const clampedPoint = {
        x: Math.max(0, Math.min(documentWidth(), point.x)),
        y: Math.max(0, Math.min(documentHeight(), point.y)),
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
      const resizedBox = original.rotation
        ? rotatedBoxForResize(original, objectInteraction.handle, point)
        : boxForResize(original, objectInteraction.handle, point);
      Object.assign(updated, resizedBox);
      if (["text", "canvas-text"].includes(original.mode) && original.scaleTextOnResize) {
        updated.fontSize = Math.max(0.5, original.fontSize * resizedBox.height / Math.max(1, original.height));
      }
    }

    const changed = JSON.stringify(updated) !== JSON.stringify(original);
    if (changed && !objectInteraction.beforeSnapshot) objectInteraction.beforeSnapshot = snapshot();
    objectInteraction.changed = changed;
    placedObjects[index] = updated;
    syncSelectionFromActiveObject();
    updateControls();
    render();
  }

  function updateSelectionInteraction(point) {
    if (!selectionInteraction) return;
    const original = selectionInteraction.originalSelection;
    if (selectionInteraction.kind === "move") {
      const requestedX = point.x - selectionInteraction.startPoint.x;
      const requestedY = point.y - selectionInteraction.startPoint.y;
      const deltaX = Math.max(-original.x, Math.min(documentWidth() - original.x - original.width, requestedX));
      const deltaY = Math.max(-original.y, Math.min(documentHeight() - original.y - original.height, requestedY));
      selection = { ...original, x: original.x + deltaX, y: original.y + deltaY };
      if (selectionInteraction.originalArrowStart && selectionInteraction.originalArrowEnd) {
        arrowStart = {
          x: selectionInteraction.originalArrowStart.x + deltaX,
          y: selectionInteraction.originalArrowStart.y + deltaY,
        };
        arrowEnd = {
          x: selectionInteraction.originalArrowEnd.x + deltaX,
          y: selectionInteraction.originalArrowEnd.y + deltaY,
        };
      }
    } else if (["arrow", "line"].includes(mode)) {
      const clampedPoint = {
        x: Math.max(0, Math.min(documentWidth(), point.x)),
        y: Math.max(0, Math.min(documentHeight(), point.y)),
      };
      arrowStart = { ...selectionInteraction.originalArrowStart };
      arrowEnd = { ...selectionInteraction.originalArrowEnd };
      if (selectionInteraction.handle === "start") arrowStart = clampedPoint;
      else arrowEnd = clampedPoint;
      selection = normalizeBox(arrowStart, arrowEnd);
    } else {
      selection = boxForResize(original, selectionInteraction.handle, point);
    }
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
      if (activeObject()?.mode === "canvas-text") loadCanvasTextObjectIntoControls(activeObject());
      renderLayers();
      scheduleCurrentImageSave();
    }
    objectInteraction = null;
    updateControls();
    render();
  }

  function finishSelectionInteraction() {
    selectionInteraction = null;
    updateControls();
    render();
  }

  function drawSelectionOutline(targetContext, box = selection) {
    if (!box) return;
    const displayScale = toolDisplayScale();
    const lineWidth = Math.max(1, 2 * displayScale);
    const handleSize = Math.max(5, 7 * displayScale);

    targetContext.save();
    targetContext.setLineDash([6 * displayScale, 4 * displayScale]);
    targetContext.lineWidth = lineWidth;
    targetContext.strokeStyle = "#2f6fed";
    targetContext.strokeRect(box.x, box.y, box.width, box.height);
    targetContext.setLineDash([]);

    const corners = [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x + box.width, box.y + box.height],
      [box.x, box.y + box.height],
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

  function drawRotatedObjectSelection(targetContext, object) {
    const displayScale = toolDisplayScale();
    const lineWidth = Math.max(1, 2 * displayScale);
    const handleSize = Math.max(5, 7 * displayScale);
    const points = rectangularObjectHandles(object);
    const corners = [points.nw, points.ne, points.se, points.sw];
    targetContext.save();
    targetContext.setLineDash([6 * displayScale, 4 * displayScale]);
    targetContext.lineWidth = lineWidth;
    targetContext.strokeStyle = "#2f6fed";
    targetContext.beginPath();
    targetContext.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((point) => targetContext.lineTo(point.x, point.y));
    targetContext.closePath();
    targetContext.stroke();
    targetContext.beginPath();
    targetContext.moveTo(points.topMiddle.x, points.topMiddle.y);
    targetContext.lineTo(points.rotate.x, points.rotate.y);
    targetContext.stroke();
    targetContext.setLineDash([]);
    targetContext.fillStyle = "#2f6fed";
    targetContext.strokeStyle = "#ffffff";
    targetContext.lineWidth = Math.max(1, displayScale);
    corners.forEach((point) => {
      targetContext.fillRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
      targetContext.strokeRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
    });
    targetContext.beginPath();
    targetContext.arc(points.rotate.x, points.rotate.y, handleSize * 0.58, 0, Math.PI * 2);
    targetContext.fill();
    targetContext.stroke();
    targetContext.restore();
  }

  function drawPendingLineHandles(targetContext) {
    const displayScale = toolDisplayScale();
    const handleSize = Math.max(6, 8 * displayScale);
    const { start, end } = resolvedArrowPoints();
    targetContext.save();
    targetContext.fillStyle = "#2f6fed";
    targetContext.strokeStyle = "white";
    targetContext.lineWidth = Math.max(1, displayScale);
    [start, end].forEach((point) => {
      targetContext.fillRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
      targetContext.strokeRect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize);
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

  function seededSigned(seed) {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  function strokeSmoothPoints(targetContext, points) {
    if (points.length < 2) return;
    targetContext.beginPath();
    targetContext.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const middle = midpoint(points[index], points[index + 1]);
      targetContext.quadraticCurveTo(points[index].x, points[index].y, middle.x, middle.y);
    }
    targetContext.lineTo(points.at(-1).x, points.at(-1).y);
    targetContext.stroke();
  }

  function roughEllipsePoints(box, size, roughness, pass = 0) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const radiusX = Math.max(0.5, box.width / 2 - size / 2);
    const radiusY = Math.max(0.5, box.height / 2 - size / 2);
    const amount = clampNumber(roughness, 1, 5, 3);
    const looseness = (amount - 1) / 4;
    const gap = 0.16 + amount * 0.052 + pass * 0.018;
    const gapCenter = -0.48 + pass * 0.035;
    const startAngle = gapCenter + gap / 2;
    const endAngle = gapCenter + Math.PI * 2 - gap / 2;
    const segments = Math.max(24, Math.min(64, Math.round((radiusX + radiusY) / 8) + amount * 2));
    const seed = centerX * 0.021 + centerY * 0.037 + box.width * 0.013 + box.height * 0.017 + pass * 17.3;
    const amplitude = Math.min(
      Math.min(radiusX, radiusY) * 0.16,
      size * (0.42 + amount * 0.32) + Math.min(Math.min(radiusX, radiusY) * 0.018 * amount, size * 1.8),
    );
    const rotation = -0.025 - looseness * 0.065 + pass * 0.018;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);

    return Array.from({ length: segments + 1 }, (_, index) => {
      const progress = index / segments;
      const angle = startAngle + (endAngle - startAngle) * progress;
      const wave = Math.sin(angle * (2.3 + amount * 0.34) + seed) * 0.55
        + Math.sin(angle * (5.1 + pass * 0.7) - seed * 0.63) * 0.27
        + seededSigned(seed + index * 1.91) * (0.15 + looseness * 0.2);
      const radialOffset = amplitude * wave + pass * size * 0.22;
      const localX = Math.cos(angle) * (radiusX + radialOffset);
      const localY = Math.sin(angle) * (radiusY + radialOffset * 0.72);
      return {
        x: centerX + localX * cosine - localY * sine,
        y: centerY + localX * sine + localY * cosine,
      };
    });
  }

  function drawStyledCircle(targetContext, box, { color, size, style, roughness = 3 }) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const radiusX = Math.max(0.5, box.width / 2 - size / 2);
    const radiusY = Math.max(0.5, box.height / 2 - size / 2);

    targetContext.save();
    prepareMarkerContext(targetContext, size, color);
    if (style !== "hand") {
      targetContext.beginPath();
      targetContext.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      targetContext.stroke();
      targetContext.restore();
      return;
    }

    const roughnessAmount = clampNumber(roughness, 1, 5, 3);
    const passCount = roughnessAmount >= 5 ? 3 : roughnessAmount >= 3 ? 2 : 1;
    for (let pass = 0; pass < passCount; pass += 1) {
      targetContext.globalAlpha = pass === 0 ? 1 : pass === 1 ? 0.28 : 0.17;
      targetContext.lineWidth = pass === 0 ? size : Math.max(1, size * (0.48 - pass * 0.08));
      if (pass > 0) targetContext.shadowColor = "transparent";
      strokeSmoothPoints(targetContext, roughEllipsePoints(box, size, roughnessAmount, pass));
    }
    targetContext.restore();
  }

  function drawMarkerCircle(targetContext) {
    drawStyledCircle(targetContext, selection, {
      color: elements.annotationColor.value,
      size: markerSize(),
      style: annotationStyle,
      roughness: annotationRoughness,
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

  function roughCurvePoints(start, control, end, size, roughness, pass = 0) {
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    const amount = clampNumber(roughness, 1, 5, 3);
    const looseness = (amount - 1) / 4;
    const segments = Math.max(10, Math.min(48, Math.round(length / 22) + amount * 3));
    const seed = start.x * 0.019 + start.y * 0.031 + end.x * 0.023 + end.y * 0.017
      + control.x * 0.013 + control.y * 0.011 + pass * 19.7;
    const amplitude = Math.min(
      length * 0.14,
      size * (0.55 + amount * 0.42) + Math.min(length * 0.003 * amount, size * 2.4),
    );

    return Array.from({ length: segments + 1 }, (_, index) => {
      const progress = index / segments;
      const point = quadraticPoint(start, control, end, progress);
      const derivativeX = 2 * (1 - progress) * (control.x - start.x) + 2 * progress * (end.x - control.x);
      const derivativeY = 2 * (1 - progress) * (control.y - start.y) + 2 * progress * (end.y - control.y);
      const derivativeLength = Math.hypot(derivativeX, derivativeY) || length || 1;
      const normalX = -derivativeY / derivativeLength;
      const normalY = derivativeX / derivativeLength;
      const envelope = Math.pow(Math.sin(Math.PI * progress), 0.72);
      const wave = Math.sin(progress * Math.PI * (2.15 + amount * 0.58) + seed) * 0.56
        + Math.sin(progress * Math.PI * (6.4 + pass * 0.45) - seed * 0.71) * 0.26
        + seededSigned(seed + index * 2.17) * (0.13 + looseness * 0.22);
      const passDrift = pass === 0
        ? 0
        : Math.sin(Math.PI * progress) * (pass % 2 === 0 ? -1 : 1) * (0.14 + pass * 0.08);
      const offset = amplitude * envelope * (wave + passDrift);
      return { x: point.x + normalX * offset, y: point.y + normalY * offset };
    });
  }

  function drawStyledCurve(targetContext, { start, end, control, color, size, style, roughness = 3, arrowHead }) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.hypot(deltaX, deltaY);
    if (length < 1) return;

    targetContext.save();
    prepareMarkerContext(targetContext, size, color);
    let renderedPoints = null;
    if (style === "hand") {
      const roughnessAmount = clampNumber(roughness, 1, 5, 3);
      const passes = [
        { alpha: 1, width: 1 },
        { alpha: 0.29, width: 0.48 },
        { alpha: 0.17, width: 0.36 },
      ];
      const passCount = roughnessAmount >= 5 ? 3 : roughnessAmount >= 3 ? 2 : 1;
      passes.slice(0, passCount).forEach((pass, index) => {
        const points = roughCurvePoints(start, control, end, size, roughnessAmount, index);
        if (index === 0) renderedPoints = points;
        targetContext.globalAlpha = pass.alpha;
        targetContext.lineWidth = Math.max(1, size * pass.width);
        if (index > 0) targetContext.shadowColor = "transparent";
        strokeSmoothPoints(targetContext, points);
      });
    } else {
      targetContext.beginPath();
      targetContext.moveTo(start.x, start.y);
      targetContext.quadraticCurveTo(control.x, control.y, end.x, end.y);
      targetContext.stroke();
    }

    if (arrowHead) {
      const directionStart = renderedPoints?.at(-2) || control;
      const tangentX = end.x - directionStart.x || deltaX;
      const tangentY = end.y - directionStart.y || deltaY;
      const tangentLength = Math.hypot(tangentX, tangentY) || length;
      const directionX = tangentX / tangentLength;
      const directionY = tangentY / tangentLength;
      const normalX = -directionY;
      const normalY = directionX;
      const headLength = Math.min(length * 0.38, Math.max(size * 4.2, 16));
      const headWidth = Math.min(length * 0.34, Math.max(size * 2.8, 12));
      const baseX = end.x - directionX * headLength;
      const baseY = end.y - directionY * headLength;
      targetContext.shadowColor = "rgba(15, 23, 42, 0.16)";
      targetContext.globalAlpha = 1;
      if (style === "hand") {
        const roughnessAmount = clampNumber(roughness, 1, 5, 3);
        const left = { x: baseX + normalX * headWidth / 2, y: baseY + normalY * headWidth / 2 };
        const right = { x: baseX - normalX * headWidth / 2, y: baseY - normalY * headWidth / 2 };
        const leftControl = midpoint(left, end);
        const rightControl = midpoint(end, right);
        leftControl.x += normalX * size * 0.45;
        leftControl.y += normalY * size * 0.45;
        rightControl.x -= normalX * size * 0.38;
        rightControl.y -= normalY * size * 0.38;
        targetContext.lineWidth = size;
        strokeSmoothPoints(targetContext, roughCurvePoints(left, leftControl, end, size, roughnessAmount, 7));
        strokeSmoothPoints(targetContext, roughCurvePoints(end, rightControl, right, size, roughnessAmount, 11));
        if (roughnessAmount >= 4) {
          targetContext.globalAlpha = 0.3;
          targetContext.lineWidth = Math.max(1, size * 0.48);
          targetContext.shadowColor = "transparent";
          strokeSmoothPoints(targetContext, roughCurvePoints(left, leftControl, end, size, roughnessAmount, 13));
          strokeSmoothPoints(targetContext, roughCurvePoints(end, rightControl, right, size, roughnessAmount, 17));
        }
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
      roughness: annotationRoughness,
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
      roughness: annotationRoughness,
      arrowHead: false,
    });
  }

  function drawAnnotation(targetContext, includeOutline = false) {
    if (!selection) return;
    if (mode === "circle") drawMarkerCircle(targetContext);
    else if (mode === "arrow") drawMarkerArrow(targetContext);
    else drawMarkerLine(targetContext);
    if (includeOutline) {
      if (["arrow", "line"].includes(mode)) drawPendingLineHandles(targetContext);
      else drawSelectionOutline(targetContext);
    }
  }

  function drawCurrentTool(targetContext, includeOutline = false) {
    if (["circle", "arrow", "line"].includes(mode)) drawAnnotation(targetContext, includeOutline);
    else if (mode === "blur" && selection) {
      drawBlurRegion(targetContext, { ...selection, blurStyle, blurStrength });
      if (includeOutline) drawSelectionOutline(targetContext);
    } else if (mode === "crop" && selection) {
      drawCropPreview(targetContext);
    } else if (["mask", "text"].includes(mode)) drawPatch(targetContext, includeOutline);
  }

  function drawBlurRegion(targetContext, region) {
    const x = Math.max(0, Math.floor(region.x));
    const y = Math.max(0, Math.floor(region.y));
    const width = Math.max(1, Math.min(targetContext.canvas.width - x, Math.ceil(region.width)));
    const height = Math.max(1, Math.min(targetContext.canvas.height - y, Math.ceil(region.height)));
    const strength = clampNumber(region.blurStrength, 2, 40, 14);
    const copy = document.createElement("canvas");
    copy.width = targetContext.canvas.width;
    copy.height = targetContext.canvas.height;
    copy.getContext("2d").drawImage(targetContext.canvas, 0, 0);

    targetContext.save();
    targetContext.beginPath();
    targetContext.rect(x, y, width, height);
    targetContext.clip();
    if (region.blurStyle === "pixelize") {
      const pixelWidth = Math.max(1, Math.ceil(width / strength));
      const pixelHeight = Math.max(1, Math.ceil(height / strength));
      const pixels = document.createElement("canvas");
      pixels.width = pixelWidth;
      pixels.height = pixelHeight;
      const pixelContext = pixels.getContext("2d");
      pixelContext.imageSmoothingEnabled = false;
      pixelContext.drawImage(copy, x, y, width, height, 0, 0, pixelWidth, pixelHeight);
      targetContext.imageSmoothingEnabled = false;
      targetContext.drawImage(pixels, 0, 0, pixelWidth, pixelHeight, x, y, width, height);
      targetContext.imageSmoothingEnabled = true;
    } else {
      targetContext.filter = `blur(${strength}px)`;
      targetContext.drawImage(copy, 0, 0);
      targetContext.filter = "none";
    }
    targetContext.restore();
  }

  function drawCropPreview(targetContext) {
    if (!selection) return;
    targetContext.save();
    targetContext.fillStyle = "rgba(15, 23, 42, 0.48)";
    targetContext.beginPath();
    targetContext.rect(0, 0, documentWidth(), documentHeight());
    targetContext.rect(selection.x, selection.y, selection.width, selection.height);
    targetContext.fill("evenodd");
    targetContext.restore();
    drawSelectionOutline(targetContext);
  }

  function drawPattern(targetContext) {
    if (pattern === "solid" || !selection) return;

    const displayScale = toolDisplayScale() * viewZoom;
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

  function selectedObjects() {
    return placedObjects.filter((object) => selectedObjectIds.has(object.id));
  }

  function clearSelectedObjects() {
    activeObjectId = null;
    selectedObjectIds.clear();
  }

  function selectOnlyObject(object) {
    activeObjectId = object?.id || null;
    selectedObjectIds = object ? new Set([object.id]) : new Set();
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
    return `${italic}${weight} ${size}px ${fontFamilyFor(object.textFont)}`;
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
    if (object.mode === "canvas-text") {
      drawCanvasTextObject(targetContext, object);
      return;
    }
    if (object.mode === "blur") {
      drawBlurRegion(targetContext, object);
      return;
    }
    if (["mask", "text"].includes(object.mode)) {
      targetContext.save();
      if (object.rotation) {
        const center = rectangularObjectCenter(object);
        targetContext.translate(center.x, center.y);
        targetContext.rotate(objectRotationRadians(object));
        targetContext.translate(-center.x, -center.y);
      }
      targetContext.fillStyle = object.backgroundColor;
      targetContext.fillRect(object.x, object.y, object.width, object.height);
      drawObjectPattern(targetContext, object);
      if (object.mode === "text" && object.text) {
        const size = objectFontSize(targetContext, object);
        const defaultPadding = Math.max(4, Math.min(size * 0.42, object.width * 0.08));
        const padding = Number.isFinite(Number(object.textInsetRatio))
          ? object.width * Number(object.textInsetRatio)
          : defaultPadding;
        const hasDetectedBaseline = Number.isFinite(Number(object.textBaselineRatio));
        targetContext.beginPath();
        targetContext.rect(object.x, object.y, object.width, object.height);
        targetContext.clip();
        targetContext.fillStyle = object.textColor;
        targetContext.font = objectFont(object, size);
        targetContext.textAlign = "left";
        targetContext.textBaseline = hasDetectedBaseline ? "alphabetic" : "middle";
        let textY = object.y + object.height / 2;
        if (hasDetectedBaseline) {
          const textMetrics = targetContext.measureText(object.text);
          const ascent = textMetrics.actualBoundingBoxAscent || size * 0.8;
          const descent = textMetrics.actualBoundingBoxDescent || size * 0.24;
          const verticalPadding = Math.max(1, Math.min(size * 0.12, object.height * 0.08));
          const minimumBaseline = object.y + verticalPadding + ascent;
          const maximumBaseline = object.y + object.height - verticalPadding - descent;
          const desiredBaseline = object.y + object.height * Number(object.textBaselineRatio);
          textY = minimumBaseline <= maximumBaseline
            ? Math.max(minimumBaseline, Math.min(maximumBaseline, desiredBaseline))
            : object.y + (object.height - ascent - descent) / 2 + ascent;
        }
        targetContext.fillText(
          object.text,
          object.x + padding,
          textY,
        );
      }
      targetContext.restore();
      return;
    }

    if (object.mode === "circle") {
      drawStyledCircle(targetContext, object, {
        color: object.annotationColor,
        size: object.annotationSize,
        style: object.annotationStyle || "clean",
        roughness: object.annotationRoughness || 3,
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
      roughness: object.annotationRoughness || 3,
      arrowHead: object.mode === "arrow",
    });
  }

  function rebuildBaseCanvas() {
    if (!sourceCanvas.width || !sourceCanvas.height) return;
    rebuildSourceCanvas();
    if (baseCanvas.width !== sourceCanvas.width) baseCanvas.width = sourceCanvas.width;
    if (baseCanvas.height !== sourceCanvas.height) baseCanvas.height = sourceCanvas.height;
    baseContext.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseContext.drawImage(sourceCanvas, 0, 0);
    placedObjects
      .filter((object) => object.mode !== "canvas-text")
      .forEach((object) => drawPlacedObject(baseContext, object));
    documentRevision += 1;
  }

  function rebuildSourceCanvas() {
    if (!sourceCanvas.width || !sourceCanvas.height) return;
    sourceContext.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    imageLayers.forEach((layer) => {
      if (layer.visible === false) return;
      sourceContext.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
    });
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
      drawRotatedObjectSelection(targetContext, object);
      return;
    }

    const displayScale = toolDisplayScale();
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

  function prepareShareContentSurface(bounds) {
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    if (shareContentSurface.width !== width) shareContentSurface.width = width;
    if (shareContentSurface.height !== height) shareContentSurface.height = height;
    shareContentSurfaceContext.setTransform(1, 0, 0, 1, 0, 0);
    shareContentSurfaceContext.clearRect(0, 0, width, height);
    shareContentSurfaceContext.imageSmoothingEnabled = true;
    shareContentSurfaceContext.imageSmoothingQuality = "high";
    const radiusScale = width / Math.max(1, bounds.width);
    const radius = Number(elements.cornerRadius.value) * radiusScale;
    shareContentSurfaceContext.save();
    roundedRectanglePath(shareContentSurfaceContext, 0, 0, width, height, radius);
    shareContentSurfaceContext.clip();
    shareContentSurfaceContext.drawImage(baseCanvas, 0, 0, width, height);
    shareContentSurfaceContext.restore();
    return shareContentSurface;
  }

  function drawShareEditableCanvas(targetContext, bounds, surface) {
    targetContext.save();
    if (shareHasBackgroundArea()) {
      const shadowUnit = Math.min(targetContext.canvas.width, targetContext.canvas.height);
      targetContext.shadowColor = "rgba(15, 23, 42, 0.3)";
      targetContext.shadowBlur = shadowUnit * 0.028;
      targetContext.shadowOffsetY = shadowUnit * 0.014;
    }
    targetContext.drawImage(surface, bounds.x, bounds.y, bounds.width, bounds.height);
    targetContext.restore();
  }

  function drawCombinedShareReflection(targetContext, bounds, surface, reflection) {
    if (!reflectionEnabled) return;
    const reflectionHeight = Math.max(1, Math.ceil(surface.height * 0.22));
    const reflectionWidth = surface.width;
    if (shareReflectionCanvas.width !== reflectionWidth) shareReflectionCanvas.width = reflectionWidth;
    if (shareReflectionCanvas.height !== reflectionHeight) shareReflectionCanvas.height = reflectionHeight;
    shareReflectionContext.setTransform(1, 0, 0, 1, 0, 0);
    shareReflectionContext.globalCompositeOperation = "source-over";
    shareReflectionContext.clearRect(0, 0, shareReflectionCanvas.width, shareReflectionCanvas.height);
    shareReflectionContext.translate(0, surface.height);
    shareReflectionContext.scale(1, -1);
    shareReflectionContext.drawImage(surface, 0, 0);
    shareReflectionContext.setTransform(1, 0, 0, 1, 0, 0);
    shareReflectionContext.globalCompositeOperation = "destination-in";
    const fade = shareReflectionContext.createLinearGradient(0, 0, 0, reflectionHeight);
    fade.addColorStop(0, "rgba(255, 255, 255, 0.42)");
    fade.addColorStop(0.7, "rgba(255, 255, 255, 0.1)");
    fade.addColorStop(1, "rgba(255, 255, 255, 0)");
    shareReflectionContext.fillStyle = fade;
    shareReflectionContext.fillRect(0, 0, shareReflectionCanvas.width, shareReflectionCanvas.height);
    targetContext.drawImage(
      shareReflectionCanvas,
      bounds.x,
      bounds.y + bounds.height + reflection.gap,
      bounds.width,
      reflection.height,
    );
  }

  function shareBlurObject(object) {
    const transform = shareContentTransform();
    return {
      ...object,
      x: transform.x + object.x * transform.scale,
      y: transform.y + object.y * transform.scale,
      width: object.width * transform.scale,
      height: object.height * transform.scale,
      blurStrength: Math.max(2, object.blurStrength * transform.scale),
    };
  }

  function drawShareEditorOverlay(targetContext) {
    const selectedObject = activeObject();
    if (selectedObject?.mode === "canvas-text") {
      selectedObjects().forEach((object) => drawObjectSelection(targetContext, object));
      return;
    }
    if (mode === "arrange" && activeImageLayer()) {
      drawSelectionOutline(targetContext, imageLayerBounds(activeImageLayer()));
      return;
    }
    const transform = shareContentTransform();
    if (!selectedObject && mode === "blur" && selection) {
      drawBlurRegion(targetContext, shareBlurObject({ ...selection, blurStyle, blurStrength }));
      drawSelectionOutline(targetContext, {
        x: transform.x + selection.x * transform.scale,
        y: transform.y + selection.y * transform.scale,
        width: selection.width * transform.scale,
        height: selection.height * transform.scale,
      });
      return;
    }
    if (mode === "smart" && smartTextAction === "blur") {
      selectedSmartTextMatches().forEach((match) => {
        drawBlurRegion(targetContext, shareBlurObject(smartTextObject(match, { createId: false })));
      });
    }
    targetContext.save();
    targetContext.translate(transform.x, transform.y);
    targetContext.scale(transform.scale, transform.scale);
    if (mode === "smart") drawSmartTextPreview(targetContext, { drawObjects: smartTextAction !== "blur" });
    else if (selectedObject) selectedObjects().forEach((object) => drawObjectSelection(targetContext, object));
    else drawCurrentTool(targetContext, true);
    targetContext.restore();
  }

  function renderShareComposition(targetContext, { includeEditorOverlay = false } = {}) {
    targetContext.clearRect(0, 0, targetContext.canvas.width, targetContext.canvas.height);
    targetContext.imageSmoothingEnabled = true;
    targetContext.imageSmoothingQuality = "high";
    if (!frameBackgroundIsTransparent()) fillGradient(targetContext, targetContext.canvas.width, targetContext.canvas.height);
    const layout = getShareLayout();
    const surface = prepareShareContentSurface(layout.content);
    drawCombinedShareReflection(targetContext, layout.content, surface, layout.reflection);
    drawScreenshotEdges(targetContext, "glow");
    drawShareEditableCanvas(targetContext, layout.content, surface);
    drawScreenshotEdges(targetContext, "outline");
    placedObjects
      .filter((object) => object.mode === "canvas-text")
      .forEach((object) => drawCanvasTextObject(targetContext, object));
    if (includeEditorOverlay) drawShareEditorOverlay(targetContext);
  }

  function render() {
    if (!imageLoaded) return;
    if (frameEnabled) {
      renderShareComposition(context, { includeEditorOverlay: true });
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sourceCanvas, 0, 0);
    placedObjects
      .filter((object) => object.mode !== "canvas-text")
      .forEach((object) => drawPlacedObject(context, object));
    const selectedObject = activeObject();
    if (mode === "smart") drawSmartTextPreview(context);
    else if (selectedObject?.mode !== "canvas-text") selectedObjects().forEach((object) => drawObjectSelection(context, object));
    else if (mode === "arrange" && activeImageLayer()) drawSelectionOutline(context);
    else drawCurrentTool(context, true);
  }

  function updateControls() {
    if (mode === "smart" && !smartTextAnalyzing) ensureSmartTextAnalysisIsFresh();
    const selectedObject = activeObject();
    const selectedCount = selectedObjects().length;
    const hasAreaSelection = Boolean(selection && selection.width >= 2 && selection.height >= 2);
    const hasToolSelection = ["arrow", "line"].includes(mode) ? arrowLength() >= 2 : hasAreaSelection;
    elements.applyButton.disabled = !imageLoaded || !hasToolSelection || Boolean(selectedObject) || ["arrange", "crop", "smart", "canvas-text"].includes(mode);
    elements.applyButton.hidden = ["arrange", "crop", "smart", "canvas-text"].includes(mode);
    elements.analyzeTextButton.disabled = !imageLoaded || smartTextAnalyzing;
    elements.clearSelectionButton.disabled = !selection;
    elements.undoButton.disabled = history.length === 0 || isRestoring;
    elements.redoButton.disabled = future.length === 0 || isRestoring;
    elements.replacementText.disabled = selectedCount > 1;
    elements.applyButtonLabel.textContent = selectedCount > 1 ? `${selectedCount} text layers selected` : selectedObject ? "Selected item" : {
      mask: "Apply mask",
      blur: "Apply blur",
      text: "Place text",
      circle: "Place circle",
      arrow: "Place arrow",
      line: "Place line",
      arrange: "Arrange image",
      crop: "Crop image",
      smart: "Analyze text",
      "canvas-text": "Canvas text selected",
    }[mode];
    updateFontSizeUI();

    if (selectedCount > 1) {
      elements.selectionReadout.textContent = `${selectedCount} text layers`;
    } else if (hasToolSelection) {
      elements.selectionReadout.textContent = ["arrow", "line"].includes(mode)
        ? `${Math.round(arrowLength())} px ${mode}`
        : `${Math.round(selection.width)} × ${Math.round(selection.height)} px`;
    } else {
      elements.selectionReadout.textContent = imageLoaded
        ? mode === "arrange"
          ? "Select an image"
          : mode === "canvas-text"
            ? "Select canvas text"
          : mode === "crop"
            ? "Drag crop area"
            : mode === "smart"
              ? "Analyze and find text"
            : (["arrow", "line"].includes(mode) ? `Drag a ${mode}` : "Draw a box")
        : "Add an image first";
    }
  }

  function setMode(nextMode, { preserveActive = false, preserveLayer = false, loadSettings = true } = {}) {
    if (!activeObject()) captureToolSettings(mode);
    if (panModeEnabled) {
      panModeEnabled = false;
      updateViewTransform();
    }
    if (!preserveActive && activeObjectId) {
      commitPendingSettingsHistory();
      clearSelectedObjects();
      selection = null;
      arrowStart = null;
      arrowEnd = null;
    }
    if (!preserveLayer && activeImageLayerId) {
      activeImageLayerId = null;
      if (!activeObjectId) selection = null;
    }
    mode = ["arrange", "mask", "blur", "text", "smart", "circle", "arrow", "line", "crop", "canvas-text"].includes(nextMode) ? nextMode : "mask";
    const isText = mode === "text";
    const isSmartText = mode === "smart";
    const isAnnotation = ["circle", "arrow", "line"].includes(mode);
    const isBlur = mode === "blur";
    [
      [elements.arrangeModeButton, "arrange"],
      [elements.maskModeButton, "mask"],
      [elements.blurModeButton, "blur"],
      [elements.textModeButton, "text"],
      [elements.smartTextModeButton, "smart"],
      [elements.circleModeButton, "circle"],
      [elements.arrowModeButton, "arrow"],
      [elements.lineModeButton, "line"],
      [elements.cropModeButton, "crop"],
    ].forEach(([button, buttonMode]) => {
      const isActive = mode === buttonMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    elements.patchFillOptions.hidden = !["mask", "text"].includes(mode);
    elements.textOptions.hidden = !isText;
    elements.smartTextOptions.hidden = !isSmartText;
    elements.blurOptions.hidden = !isBlur;
    elements.annotationOptions.hidden = !isAnnotation;
    elements.annotationNote.textContent = ["arrow", "line"].includes(mode)
      ? `Drag the ${mode}, then move the diamond handle to bend it.`
      : "Drag a box around the area to circle.";
    if (["arrow", "line"].includes(mode) && selection && (!arrowStart || !arrowEnd)) {
      arrowStart = { x: selection.x, y: selection.y };
      arrowEnd = { x: selection.x + selection.width, y: selection.y + selection.height };
    }
    if (loadSettings && !isSmartText) applyToolSettings(mode);
    if (isSmartText) ensureSmartTextAnalysisIsFresh();
    if (imageLoaded) {
      elements.workspaceTip.textContent = mode === "arrange"
        ? "Click an image · drag to move · corners resize"
        : mode === "crop"
          ? "Drag a box to crop immediately"
          : mode === "canvas-text"
            ? "Drag text to move · corners resize · top handle rotates"
          : mode === "smart"
            ? "Analyze text · search phrases · preview every match"
          : "Drag to place · click an item to edit";
    }
    updateControls();
    render();
    if (isText && selection) elements.replacementText.focus({ preventScroll: true });
  }

  function selectPlacedObject(object, { additive = false } = {}) {
    commitPendingSettingsHistory();
    if (object.mode === "canvas-text" && !frameEnabled) {
      frameEnabled = true;
      elements.frameEnabled.checked = true;
      savePreference(STORAGE_KEYS.frameEnabled, "true");
      updatePresentationUI();
    }
    const canAdd = additive && object.mode === "text" && selectedObjects().every((selected) => selected.mode === "text");
    if (canAdd) {
      if (selectedObjectIds.has(object.id)) selectedObjectIds.delete(object.id);
      else selectedObjectIds.add(object.id);
      const remainingIds = [...selectedObjectIds];
      activeObjectId = selectedObjectIds.has(object.id) ? object.id : remainingIds.at(-1) || null;
      object = activeObject();
      if (!object) {
        selection = null;
        updateControls();
        render();
        return;
      }
    } else {
      selectOnlyObject(object);
    }
    syncSelectionFromActiveObject();
    activeImageLayerId = null;
    setMode(object.mode, { preserveActive: true, loadSettings: false });
    if (object.mode === "canvas-text") {
      loadCanvasTextObjectIntoControls(object);
      renderLayers();
      updateControls();
      render();
      return;
    }
    elements.backgroundColor.value = object.backgroundColor || "#111827";
    elements.textColor.value = object.textColor || "#ffffff";
    elements.fontSize.value = String(object.fontSize || 28);
    elements.autoTextSize.checked = object.autoTextSize === true;
    elements.replacementText.value = object.text || "";
    elements.annotationColor.value = object.annotationColor || "#ef4444";
    elements.annotationSize.value = String(object.annotationSize || 6);
    blurStyle = ["gaussian", "pixelize"].includes(object.blurStyle) ? object.blurStyle : "gaussian";
    blurStrength = clampNumber(object.blurStrength, 2, 40, 14);
    elements.blurStrength.value = String(blurStrength);
    elements.blurStrengthValue.value = blurStyle === "pixelize" ? `${blurStrength} px` : `${blurStrength}`;
    elements.blurStyleButtons.forEach((button) => {
      const isActive = button.dataset.blurStyle === blurStyle;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    textFont = TEXT_FONTS[object.textFont] ? object.textFont : "sans";
    elements.textFontButtons.forEach((button) => {
      const isActive = button.dataset.textFont === textFont;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
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
    annotationRoughness = clampNumber(object.annotationRoughness, 1, 5, 3);
    elements.annotationRoughness.value = String(annotationRoughness);
    elements.annotationRoughnessValue.value = roughnessLabel();
    elements.annotationRoughnessField.hidden = annotationStyle !== "hand";
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
    const objects = selectedObjects();
    if (!pendingSettingsHistory) pendingSettingsHistory = snapshot();
    objects.forEach((selectedObject) => {
      selectedObject.pattern = pattern;
      selectedObject.backgroundColor = elements.backgroundColor.value;
      if (objects.length === 1 && selectedObject.mode === "text") selectedObject.text = elements.replacementText.value.trim();
      selectedObject.textColor = elements.textColor.value;
      selectedObject.textFont = textFont;
      selectedObject.textStyle = textStyle;
      selectedObject.fontSize = Number(elements.fontSize.value);
      selectedObject.autoTextSize = elements.autoTextSize.checked;
      selectedObject.annotationColor = elements.annotationColor.value;
      selectedObject.annotationSize = markerSize();
      selectedObject.annotationStyle = annotationStyle;
      selectedObject.annotationRoughness = annotationRoughness;
      selectedObject.blurStyle = blurStyle;
      selectedObject.blurStrength = blurStrength;
    });
    captureToolSettings(object.mode);
    rebuildBaseCanvas();
    render();
    scheduleCurrentImageSave();
    window.clearTimeout(settingsHistoryTimer);
    settingsHistoryTimer = window.setTimeout(commitPendingSettingsHistory, 450);
  }

  function snapshot() {
    return {
      width: documentWidth(),
      height: documentHeight(),
      layers: cloneImageLayers(),
      objects: clonePlacedObjects(),
    };
  }

  function restoreSnapshot(documentSnapshot) {
    isRestoring = true;
    clearSelectedObjects();
    activeImageLayerId = null;
    updateControls();
    if (Array.isArray(documentSnapshot.layers)) {
      canvas.width = documentSnapshot.width;
      canvas.height = documentSnapshot.height;
      sourceCanvas.width = documentSnapshot.width;
      sourceCanvas.height = documentSnapshot.height;
      baseCanvas.width = documentSnapshot.width;
      baseCanvas.height = documentSnapshot.height;
      imageLayers = cloneImageLayers(documentSnapshot.layers);
      placedObjects = clonePlacedObjects(documentSnapshot.objects || []);
      rebuildBaseCanvas();
      selection = null;
      arrowStart = null;
      arrowEnd = null;
      fitView({ notify: false });
      isRestoring = false;
      renderLayers();
      updatePresentationUI();
      updateControls();
      render();
      scheduleCurrentImageSave();
      return;
    }
    const image = new Image();
    image.onload = () => {
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      sourceContext.drawImage(image, 0, 0);
      imageLayers = [createImageLayer(image, null, "Restored image")];
      baseCanvas.width = image.naturalWidth;
      baseCanvas.height = image.naturalHeight;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      placedObjects = clonePlacedObjects(documentSnapshot.objects || []);
      rebuildBaseCanvas();
      selection = null;
      arrowStart = null;
      arrowEnd = null;
      fitView({ notify: false });
      isRestoring = false;
      renderLayers();
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
      textFont,
      textStyle,
      fontSize: Number(elements.fontSize.value),
      autoTextSize: elements.autoTextSize.checked,
      annotationColor: elements.annotationColor.value,
      annotationSize: markerSize(),
      annotationStyle,
      annotationRoughness,
      blurStyle,
      blurStrength,
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
    const displayScale = toolDisplayScale() * viewZoom;
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
    selectOnlyObject(object);
    selectionInteraction = null;
    syncSelectionFromActiveObject();
    rebuildBaseCanvas();
    rememberCurrentPreset();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast({
      mask: "Mask applied.",
      blur: `${capitalize(blurStyle)} blur applied.`,
      text: "Text placed.",
      circle: "Circle placed.",
      arrow: "Arrow placed.",
      line: "Line placed.",
    }[mode]);
  }

  function cropToSelection() {
    if (!selection || selection.width < 2 || selection.height < 2) return;
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
    imageLayers = imageLayers.map((layer) => ({ ...layer, x: layer.x - left, y: layer.y - top }));
    placedObjects = placedObjects
      .filter((object) => {
        if (object.mode === "canvas-text") return true;
        const bounds = objectBounds(object);
        return bounds.x + bounds.width >= left && bounds.y + bounds.height >= top && bounds.x <= right && bounds.y <= bottom;
      })
      .map((object) => {
        const translated = { ...object };
        if (translated.mode === "canvas-text") return translated;
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
    baseCanvas.width = width;
    baseCanvas.height = height;
    canvas.width = width;
    canvas.height = height;
    clearSelectedObjects();
    activeImageLayerId = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    rebuildBaseCanvas();
    fitView({ notify: false });
    updatePresentationUI();
    renderLayers();
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
    clearSelectedObjects();
    activeImageLayerId = null;
    objectInteraction = null;
    imageLayerInteraction = null;
    selectionInteraction = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    updateControls();
    renderLayers();
    render();
  }

  function deleteActiveObject() {
    const objects = selectedObjects();
    if (!objects.length) return false;
    const objectIds = new Set(objects.map((object) => object.id));
    rememberHistoryStep();
    placedObjects = placedObjects.filter((placedObject) => !objectIds.has(placedObject.id));
    clearSelectedObjects();
    objectInteraction = null;
    selection = null;
    arrowStart = null;
    arrowEnd = null;
    rebuildBaseCanvas();
    renderLayers();
    updateControls();
    render();
    scheduleCurrentImageSave();
    showToast(objects.length === 1 ? "Item removed." : `${objects.length} items removed.`);
    return true;
  }

  function fillGradient(targetContext, width, height) {
    targetContext.fillStyle = linearGradientForBounds(targetContext, gradientName, { x: 0, y: 0, width, height });
    targetContext.fillRect(0, 0, width, height);
  }

  function linearGradientForBounds(targetContext, name, bounds) {
    const definition = GRADIENTS[name] || GRADIENTS.dusk;
    const radians = ((definition.angle - 90) * Math.PI) / 180;
    const directionX = Math.cos(radians);
    const directionY = Math.sin(radians);
    const length = Math.abs(bounds.width * directionX) + Math.abs(bounds.height * directionY);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const gradient = targetContext.createLinearGradient(
      centerX - (directionX * length) / 2,
      centerY - (directionY * length) / 2,
      centerX + (directionX * length) / 2,
      centerY + (directionY * length) / 2,
    );
    definition.stops.forEach((color, index) => {
      gradient.addColorStop(index / Math.max(1, definition.stops.length - 1), color);
    });
    return gradient;
  }

  function wrapCanvasTextLines(targetContext, text, maximumWidth) {
    const lines = [];
    String(text || "").split("\n").forEach((paragraph) => {
      if (!paragraph) {
        lines.push("");
        return;
      }
      const words = paragraph.split(/\s+/);
      let line = "";
      words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && targetContext.measureText(candidate).width > maximumWidth) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      });
      lines.push(line);
    });
    return lines;
  }

  function drawCanvasTextObject(targetContext, object) {
    if (!object.text) return;
    const size = Math.max(1, Number(object.fontSize) || 72);
    const lineHeight = size * Math.max(0.8, Number(object.lineHeight) || 1.04);
    targetContext.save();
    if (object.rotation) {
      const center = rectangularObjectCenter(object);
      targetContext.translate(center.x, center.y);
      targetContext.rotate(objectRotationRadians(object));
      targetContext.translate(-center.x, -center.y);
    }
    targetContext.beginPath();
    targetContext.rect(object.x, object.y, object.width, object.height);
    targetContext.clip();
    targetContext.font = objectFont(object, size);
    targetContext.textAlign = "left";
    targetContext.textBaseline = "top";
    targetContext.fillStyle = object.fillMode === "gradient"
      ? linearGradientForBounds(targetContext, object.gradientName || "tide", object)
      : object.textColor || "#ffffff";
    const lines = wrapCanvasTextLines(targetContext, object.text, Math.max(1, object.width));
    lines.forEach((line, index) => {
      const y = object.y + index * lineHeight;
      if (y <= object.y + object.height) targetContext.fillText(line, object.x, y);
    });
    targetContext.restore();
  }

  function drawScreenshotEdges(targetContext, phase) {
    const transform = shareContentTransform();
    imageLayers.forEach((layer) => {
      if (layer.visible === false) return;
      const settings = edgeSettingsFor(layer);
      if (settings.edgeStyle === "none") return;
      const bounds = imageLayerBounds(layer);
      const radius = Math.max(0, Math.min(
        Number(elements.cornerRadius.value) * transform.scale,
        bounds.width / 2,
        bounds.height / 2,
      ));
      const stroke = settings.edgeStyle === "gradient"
        ? linearGradientForBounds(targetContext, settings.edgeGradient, bounds)
        : settings.edgeColor;
      targetContext.save();
      roundedRectanglePath(targetContext, bounds.x, bounds.y, bounds.width, bounds.height, radius);
      targetContext.strokeStyle = stroke;
      targetContext.lineJoin = "round";
      targetContext.lineWidth = Math.max(1, settings.edgeWidth);
      if (phase === "glow") {
        if (!settings.edgeGlow) {
          targetContext.restore();
          return;
        }
        targetContext.globalAlpha = 0.72;
        targetContext.shadowColor = settings.edgeStyle === "solid"
          ? settings.edgeColor
          : (GRADIENTS[settings.edgeGradient] || GRADIENTS.tide).stops[1];
        targetContext.shadowBlur = settings.edgeGlow;
      }
      targetContext.stroke();
      targetContext.restore();
    });
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
    renderShareComposition(outputContext);
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
    const files = [...event.dataTransfer.files].filter(isImageFile);
    if (files.length) loadImageFiles(files, { replace: !imageLoaded });
    else showToast("Drop an image file here.");
  }

  elements.newCanvasButton.addEventListener("click", startNewCanvas);
  elements.replaceImageButton.addEventListener("click", () => chooseFile("replace"));
  elements.pasteCard.addEventListener("click", () => chooseFile(imageLoaded ? "add" : "replace"));
  elements.emptyState.addEventListener("click", () => chooseFile("replace"));
  elements.addLayerButton.addEventListener("click", () => chooseFile("add"));

  elements.fileInput.addEventListener("change", () => {
    if (elements.fileInput.files.length) loadImageFiles(elements.fileInput.files, { replace: filePickerIntent === "replace" });
    elements.fileInput.value = "";
  });

  document.addEventListener("paste", (event) => {
    const imageItems = [...event.clipboardData.items].filter((item) => item.type.startsWith("image/"));
    if (!imageItems.length) return;
    event.preventDefault();
    const blobs = imageItems.map((item) => item.getAsFile()).filter(Boolean);
    if (blobs.length) loadImageFiles(blobs, { replace: !imageLoaded });
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
    const outputPoint = canvasOutputPoint(event);
    const selectedCanvasText = activeObject()?.mode === "canvas-text" ? activeObject() : null;
    const canvasTextHandle = selectedCanvasText ? activeHandleAtPoint(outputPoint) : null;
    const canvasTextHit = frameEnabled ? findObjectAtPoint(outputPoint, "share") : null;
    if (canvasTextHandle || canvasTextHit) {
      const object = canvasTextHit || selectedCanvasText;
      if (object.id !== activeObjectId) selectPlacedObject(object);
      canvas.setPointerCapture(event.pointerId);
      beginObjectInteraction(object, outputPoint, canvasTextHandle);
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return;
    }
    if (mode === "canvas-text") {
      clearSelectedObjects();
      selection = null;
      renderLayers();
      updateControls();
      render();
      return;
    }
    if (mode === "smart") return;
    canvas.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    if (mode === "arrange") {
      const layerHandle = imageLayerHandleAtPoint(point);
      const layer = layerHandle ? activeImageLayer() : findImageLayerAtPoint(point);
      if (layer) {
        if (layer.id !== activeImageLayerId) selectImageLayer(layer);
        beginImageLayerInteraction(layer, point, layerHandle);
        canvas.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      } else {
        activeImageLayerId = null;
        selection = null;
        renderLayers();
        updateControls();
        render();
      }
      return;
    }
    const selectedHandle = activeHandleAtPoint(point);
    if (mode !== "crop" && activeObject() && selectedHandle) {
      beginObjectInteraction(activeObject(), point, selectedHandle);
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return;
    }

    const pendingHandle = mode === "crop" ? null : selectionHandleAtPoint(point);
    if (pendingHandle) {
      beginSelectionInteraction(point, pendingHandle);
      canvas.style.cursor = ["nw", "se"].includes(pendingHandle) ? "nwse-resize"
        : ["ne", "sw"].includes(pendingHandle) ? "nesw-resize" : "grabbing";
      document.body.style.userSelect = "none";
      return;
    }

    const hitObject = mode === "crop" ? null : findObjectAtPoint(point);
    if (hitObject) {
      if (event.shiftKey && hitObject.mode === "text") {
        selectPlacedObject(hitObject, { additive: true });
        canvas.style.cursor = "default";
        return;
      }
      if (hitObject.id !== activeObjectId) selectPlacedObject(hitObject);
      beginObjectInteraction(hitObject, point, activeHandleAtPoint(point));
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return;
    }

    if (mode !== "crop" && selectionContainsPoint(point)) {
      beginSelectionInteraction(point);
      canvas.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return;
    }

    commitPendingSettingsHistory();
    clearSelectedObjects();
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
    if (mode === "smart" && !imageLayerInteraction && !objectInteraction && !selectionInteraction) {
      canvas.style.cursor = "default";
      return;
    }
    if (imageLayerInteraction) {
      updateImageLayerInteraction(currentPoint);
      return;
    }
    if (objectInteraction) {
      updateObjectInteraction(currentPoint);
      return;
    }

    if (selectionInteraction) {
      updateSelectionInteraction(currentPoint);
      return;
    }

    if (!isSelecting) {
      const handle = mode === "arrange"
        ? imageLayerHandleAtPoint(currentPoint)
        : activeHandleAtPoint(currentPoint) || selectionHandleAtPoint(currentPoint);
      if (["nw", "se"].includes(handle)) canvas.style.cursor = "nwse-resize";
      else if (["ne", "sw"].includes(handle)) canvas.style.cursor = "nesw-resize";
      else if (["start", "end", "control", "rotate"].includes(handle)) canvas.style.cursor = "grab";
      else if (mode === "arrange" && findImageLayerAtPoint(currentPoint)) canvas.style.cursor = "move";
      else if (selectionContainsPoint(currentPoint)) canvas.style.cursor = "move";
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
    if (imageLayerInteraction) {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      document.body.style.userSelect = "";
      finishImageLayerInteraction();
      canvas.style.cursor = "crosshair";
      return;
    }
    if (objectInteraction) {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      document.body.style.userSelect = "";
      finishObjectInteraction();
      canvas.style.cursor = "crosshair";
      return;
    }
    if (selectionInteraction) {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      document.body.style.userSelect = "";
      finishSelectionInteraction();
      if (event.type === "pointerup") applyCurrentTool();
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
    if (selection && event.type === "pointerup") {
      if (mode === "crop") cropToSelection();
      else applyCurrentTool();
    }
    if (selection && mode === "text") elements.replacementText.focus({ preventScroll: true });
    else if (selection) canvas.focus({ preventScroll: true });
  }

  canvas.addEventListener("pointerup", finishSelection);
  canvas.addEventListener("pointercancel", finishSelection);
  canvas.addEventListener("keydown", (event) => {
    if (!imageLoaded) return;

    const selectedObject = activeObject();
    const selectedLayer = mode === "arrange" ? activeImageLayer() : null;
    if (selectedLayer && ["Delete", "Backspace"].includes(event.key)) {
      event.preventDefault();
      deleteImageLayer(selectedLayer.id);
      return;
    }

    if (selectedLayer && event.key.startsWith("Arrow")) {
      event.preventDefault();
      const step = event.altKey ? 1 : 10;
      const [deltaX, deltaY] = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }[event.key];
      rememberHistoryStep();
      const bounds = imageLayerBounds(selectedLayer);
      bounds.x += deltaX;
      bounds.y += deltaY;
      if (frameEnabled) applyShareBoundsToLayer(selectedLayer, bounds);
      else {
        selectedLayer.x = bounds.x;
        selectedLayer.y = bounds.y;
      }
      rebuildBaseCanvas();
      selection = bounds;
      renderLayers();
      updateControls();
      render();
      scheduleCurrentImageSave();
      return;
    }
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
      const limits = selectedObject.mode === "canvas-text"
        ? getOutputDimensions()
        : { width: documentWidth(), height: documentHeight() };
      const deltaX = Math.max(-bounds.x, Math.min(limits.width - bounds.x - bounds.width, requestedX));
      const deltaY = Math.max(-bounds.y, Math.min(limits.height - bounds.y - bounds.height, requestedY));
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

    if (event.key === " " && !selection && !["arrange", "crop", "smart"].includes(mode)) {
      event.preventDefault();
      selection = {
        x: documentWidth() * 0.25,
        y: documentHeight() * 0.4,
        width: documentWidth() * 0.5,
        height: documentHeight() * 0.16,
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
      selection.width = Math.max(2, Math.min(documentWidth() - selection.x, selection.width + direction[0]));
      selection.height = Math.max(2, Math.min(documentHeight() - selection.y, selection.height + direction[1]));
      arrowStart = { x: selection.x, y: selection.y };
      arrowEnd = { x: selection.x + selection.width, y: selection.y + selection.height };
    } else {
      const previousX = selection.x;
      const previousY = selection.y;
      selection.x = Math.max(0, Math.min(documentWidth() - selection.width, selection.x + direction[0]));
      selection.y = Math.max(0, Math.min(documentHeight() - selection.height, selection.y + direction[1]));
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

  elements.arrangeModeButton.addEventListener("click", () => setMode("arrange"));
  elements.maskModeButton.addEventListener("click", () => setMode("mask"));
  elements.blurModeButton.addEventListener("click", () => setMode("blur"));
  elements.textModeButton.addEventListener("click", () => setMode("text"));
  elements.smartTextModeButton.addEventListener("click", () => setMode("smart"));
  elements.circleModeButton.addEventListener("click", () => setMode("circle"));
  elements.arrowModeButton.addEventListener("click", () => setMode("arrow"));
  elements.lineModeButton.addEventListener("click", () => setMode("line"));
  elements.cropModeButton.addEventListener("click", () => setMode("crop"));
  elements.analyzeTextButton.addEventListener("click", analyzeSmartText);
  elements.smartTextQuery.addEventListener("input", updateSmartTextMatches);
  elements.smartTextCaseSensitive.addEventListener("change", updateSmartTextMatches);
  elements.smartTextWholeWord.addEventListener("change", updateSmartTextMatches);
  elements.smartTextActionButtons.forEach((button) => {
    button.addEventListener("click", () => setSmartTextAction(button.dataset.smartAction));
  });
  elements.smartTextReplacement.addEventListener("input", () => {
    syncSmartTextApplyState();
    render();
  });
  elements.smartTextFont.addEventListener("change", () => {
    smartTextFont = ["auto", ...Object.keys(TEXT_FONTS)].includes(elements.smartTextFont.value)
      ? elements.smartTextFont.value
      : "auto";
    savePreference(STORAGE_KEYS.smartTextFont, smartTextFont);
    renderSmartTextMatches();
  });
  elements.smartTextWeight.addEventListener("change", () => {
    smartTextWeight = ["auto", "normal", "bold"].includes(elements.smartTextWeight.value)
      ? elements.smartTextWeight.value
      : "auto";
    savePreference(STORAGE_KEYS.smartTextWeight, smartTextWeight);
    renderSmartTextMatches();
  });
  elements.smartTextSizeScale.addEventListener("input", () => {
    smartTextSizeScale = clampNumber(elements.smartTextSizeScale.value, 1, 200, 100);
    elements.smartTextSizeScaleValue.value = `${smartTextSizeScale}%`;
    savePreference(STORAGE_KEYS.smartTextSizeScale, String(smartTextSizeScale));
    renderSmartTextMatches();
  });
  elements.smartTextRotation.addEventListener("input", () => {
    smartTextRotation = clampNumber(elements.smartTextRotation.value, -180, 180, 0);
    elements.smartTextRotationValue.value = `${smartTextRotation}°`;
    savePreference(STORAGE_KEYS.smartTextRotation, String(smartTextRotation));
    renderSmartTextMatches();
  });
  elements.smartTextBlurStyleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      smartTextBlurStyle = button.dataset.smartBlurStyle === "pixelize" ? "pixelize" : "gaussian";
      savePreference(STORAGE_KEYS.smartTextBlurStyle, smartTextBlurStyle);
      updateSmartTextOptionUI();
      render();
    });
  });
  elements.smartTextBlurStrength.addEventListener("input", () => {
    smartTextBlurStrength = clampNumber(elements.smartTextBlurStrength.value, 2, 40, 14);
    savePreference(STORAGE_KEYS.smartTextBlurStrength, String(smartTextBlurStrength));
    updateSmartTextOptionUI();
    render();
  });
  elements.smartTextMaskColor.addEventListener("input", () => {
    savePreference(STORAGE_KEYS.smartTextMaskColor, elements.smartTextMaskColor.value);
    updateSmartTextOptionUI();
    render();
  });
  elements.smartTextMaskPatternButtons.forEach((button) => {
    button.addEventListener("click", () => {
      smartTextMaskPattern = ["solid", "diagonal", "hatch"].includes(button.dataset.smartMaskPattern)
        ? button.dataset.smartMaskPattern
        : "solid";
      savePreference(STORAGE_KEYS.smartTextMaskPattern, smartTextMaskPattern);
      updateSmartTextOptionUI();
      render();
    });
  });
  elements.smartTextToggleMatches.addEventListener("click", () => {
    const selectAll = selectedSmartTextMatches().length !== smartTextMatches.length;
    smartTextMatches.forEach((match) => { match.selected = selectAll; });
    renderSmartTextMatches();
  });
  elements.applySmartTextButton.addEventListener("click", applySmartTextMatches);
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
  elements.blurStyleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      blurStyle = button.dataset.blurStyle;
      elements.blurStyleButtons.forEach((styleButton) => {
        const active = styleButton.dataset.blurStyle === blurStyle;
        styleButton.classList.toggle("is-active", active);
        styleButton.setAttribute("aria-pressed", String(active));
      });
      elements.blurStrengthValue.value = blurStyle === "pixelize" ? `${blurStrength} px` : `${blurStrength}`;
      captureToolSettings("blur");
      syncActiveObjectFromControls();
      if (!activeObject()) render();
    });
  });
  elements.blurStrength.addEventListener("input", () => {
    blurStrength = clampNumber(elements.blurStrength.value, 2, 40, 14);
    elements.blurStrengthValue.value = blurStyle === "pixelize" ? `${blurStrength} px` : `${blurStrength}`;
    captureToolSettings("blur");
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.applyButton.addEventListener("click", applyCurrentTool);
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
  elements.reflectionEnabled.addEventListener("change", () => {
    reflectionEnabled = elements.reflectionEnabled.checked;
    savePreference(STORAGE_KEYS.reflectionEnabled, String(reflectionEnabled));
    scheduleCurrentImageSave();
    updatePresentationUI();
    showToast(reflectionEnabled ? "Reflection added to share canvas." : "Reflection removed.");
  });
  elements.ratioButtons.forEach((button) => {
    button.addEventListener("click", () => setAspectPreset(button));
  });
  elements.contentPositionButtons.forEach((button) => {
    button.addEventListener("click", () => setContentPosition(button.dataset.contentPosition));
  });
  elements.gradientButtons.forEach((button) => {
    button.addEventListener("click", () => setGradient(button.dataset.gradient));
  });
  elements.edgeStyleButtons.forEach((button) => {
    button.addEventListener("click", () => syncScreenshotEdgeFromControls({ edgeStyle: button.dataset.edgeStyle }));
  });
  elements.edgeGradientButtons.forEach((button) => {
    button.addEventListener("click", () => syncScreenshotEdgeFromControls({
      edgeStyle: "gradient",
      edgeGradient: button.dataset.edgeGradient,
    }));
  });
  elements.edgeColor.addEventListener("input", () => syncScreenshotEdgeFromControls({ edgeStyle: "solid" }));
  elements.edgeWidth.addEventListener("input", () => syncScreenshotEdgeFromControls());
  elements.edgeGlow.addEventListener("input", () => syncScreenshotEdgeFromControls());

  elements.canvasTextFillButtons.forEach((button) => {
    button.addEventListener("click", () => {
      canvasTextFill = button.dataset.canvasTextFill === "gradient" ? "gradient" : "solid";
      syncCanvasTextObjectFromControls();
    });
  });
  elements.canvasTextGradientButtons.forEach((button) => {
    button.addEventListener("click", () => {
      canvasTextGradient = GRADIENTS[button.dataset.canvasTextGradient] ? button.dataset.canvasTextGradient : "tide";
      canvasTextFill = "gradient";
      syncCanvasTextObjectFromControls();
    });
  });
  elements.canvasTextFontButtons.forEach((button) => {
    button.addEventListener("click", () => {
      canvasTextFont = TEXT_FONTS[button.dataset.canvasTextFont] ? button.dataset.canvasTextFont : "sans";
      syncCanvasTextObjectFromControls();
    });
  });
  elements.canvasTextStyleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      canvasTextStyle = ["normal", "bold", "italic"].includes(button.dataset.canvasTextStyle)
        ? button.dataset.canvasTextStyle
        : "bold";
      syncCanvasTextObjectFromControls();
    });
  });
  elements.canvasTextContent.addEventListener("input", syncCanvasTextObjectFromControls);
  elements.canvasTextColor.addEventListener("input", () => {
    canvasTextFill = "solid";
    syncCanvasTextObjectFromControls();
  });
  elements.canvasTextSize.addEventListener("input", syncCanvasTextObjectFromControls);
  elements.canvasTextAddButton.addEventListener("click", createCanvasTextLayer);
  elements.paddingUnitButtons.forEach((button) => {
    button.addEventListener("click", () => setPaddingUnit(button.dataset.paddingUnit));
  });
  [elements.framePaddingX, elements.framePaddingY].forEach((input) => {
    input.addEventListener("input", () => {
      if (!Number.isFinite(Number(input.value))) return;
      savePaddingPreferences();
      scheduleCurrentImageSave();
      updatePresentationUI();
    });
    input.addEventListener("blur", () => normalizePaddingInputs());
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      event.stopPropagation();
      input.blur();
    });
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
    captureToolSettings(mode);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.textColor.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.textColor, elements.textColor.value);
    captureToolSettings("text");
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.annotationColor.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.annotationColor, elements.annotationColor.value);
    captureToolSettings(mode);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.annotationSize.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.annotationSize, elements.annotationSize.value);
    captureToolSettings(mode);
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.annotationRoughness.addEventListener("input", () => {
    setAnnotationRoughness(elements.annotationRoughness.value);
  });
  elements.textFontButtons.forEach((button) => {
    button.addEventListener("click", () => setTextFont(button.dataset.textFont));
  });
  elements.textStyleButtons.forEach((button) => {
    button.addEventListener("click", () => setTextStyle(button.dataset.textStyle));
  });
  elements.fontSize.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    captureToolSettings("text");
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.autoTextSize.addEventListener("change", () => {
    savePreference(STORAGE_KEYS.autoTextSize, String(elements.autoTextSize.checked));
    captureToolSettings("text");
    updateFontSizeUI();
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  elements.replacementText.addEventListener("input", () => {
    updateFontSizeUI();
    captureToolSettings("text");
    syncActiveObjectFromControls();
    if (!activeObject()) render();
  });
  [
    elements.backgroundColor,
    elements.textColor,
    elements.annotationColor,
    elements.annotationSize,
    elements.annotationRoughness,
    elements.fontSize,
    elements.autoTextSize,
    elements.replacementText,
    elements.edgeColor,
    elements.edgeWidth,
    elements.edgeGlow,
    elements.canvasTextContent,
    elements.canvasTextColor,
    elements.canvasTextSize,
  ].forEach((input) => input.addEventListener("change", commitPendingSettingsHistory));
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
