(() => {
  const canvas = document.querySelector("#editorCanvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const baseCanvas = document.createElement("canvas");
  const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });

  const elements = {
    fileInput: document.querySelector("#fileInput"),
    newImageButton: document.querySelector("#newImageButton"),
    replaceImageButton: document.querySelector("#replaceImageButton"),
    pasteCard: document.querySelector("#pasteCard"),
    emptyState: document.querySelector("#emptyState"),
    canvasWrap: document.querySelector("#canvasWrap"),
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
    fontSize: document.querySelector("#fontSize"),
    fontSizeValue: document.querySelector("#fontSizeValue"),
    applyButton: document.querySelector("#applyButton"),
    applyButtonLabel: document.querySelector("#applyButtonLabel"),
    undoButton: document.querySelector("#undoButton"),
    redoButton: document.querySelector("#redoButton"),
    clearSelectionButton: document.querySelector("#clearSelectionButton"),
    downloadButton: document.querySelector("#downloadButton"),
    selectionReadout: document.querySelector("#selectionReadout"),
    imageMeta: document.querySelector("#imageMeta"),
    workspaceTip: document.querySelector("#workspaceTip"),
    recentList: document.querySelector("#recentList"),
    recentEmpty: document.querySelector("#recentEmpty"),
    clearRecentButton: document.querySelector("#clearRecentButton"),
    toast: document.querySelector("#toast"),
  };

  const STORAGE_KEYS = {
    backgroundColor: "patchwork.backgroundColor",
    textColor: "patchwork.textColor",
    fontSize: "patchwork.fontSize",
    pattern: "patchwork.pattern",
    recentPatches: "patchwork.recentPatches",
  };

  let imageLoaded = false;
  let imageName = "image";
  let mode = "mask";
  let pattern = "solid";
  let selection = null;
  let dragStart = null;
  let isSelecting = false;
  let history = [];
  let future = [];
  let isRestoring = false;
  let recentPatches = [];
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

  function initializePreferences() {
    elements.backgroundColor.value = readPreference(STORAGE_KEYS.backgroundColor, "#111827");
    elements.textColor.value = readPreference(STORAGE_KEYS.textColor, "#ffffff");
    elements.fontSize.value = readPreference(STORAGE_KEYS.fontSize, "28");
    const savedPattern = readPreference(STORAGE_KEYS.pattern, "solid");
    setPattern(["solid", "diagonal", "hatch"].includes(savedPattern) ? savedPattern : "solid", false);
    loadRecentPatches();
    updatePreferenceLabels();
  }

  function updatePreferenceLabels() {
    elements.backgroundColorValue.value = elements.backgroundColor.value.toUpperCase();
    elements.textColorValue.value = elements.textColor.value.toUpperCase();
    elements.fontSizeValue.value = `${elements.fontSize.value} px`;
    const lineColor = getPatternLineColor(elements.backgroundColor.value, 0.32);
    elements.patternButtons.forEach((button) => {
      button.style.setProperty("--sample-color", elements.backgroundColor.value);
      button.style.setProperty("--sample-line", lineColor);
    });
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
      recentPatches = Array.isArray(saved)
        ? saved
            .filter((preset) => preset && ["mask", "text"].includes(preset.mode))
            .map((preset) => ({
              ...preset,
              pattern: ["solid", "diagonal", "hatch"].includes(preset.pattern) ? preset.pattern : "solid",
            }))
            .slice(0, 6)
        : [];
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
      fontSize: Number(elements.fontSize.value),
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
      preset.fontSize,
    ]);
  }

  function rememberCurrentPreset() {
    const preset = currentPreset();
    const key = presetKey(preset);
    recentPatches = [preset, ...recentPatches.filter((item) => presetKey(item) !== key)].slice(0, 6);
    savePreference(STORAGE_KEYS.recentPatches, JSON.stringify(recentPatches));
    renderRecentPatches();
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
      swatch.setAttribute("aria-hidden", "true");

      const copy = document.createElement("span");
      copy.className = "recent-copy";
      const title = document.createElement("strong");
      title.textContent = preset.mode === "text" ? preset.text || "Text patch" : `${capitalize(preset.pattern || "solid")} mask`;
      const detail = document.createElement("small");
      detail.textContent = preset.mode === "text"
        ? `${preset.fontSize || 28} px · ${capitalize(preset.pattern || "solid")}`
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
    elements.backgroundColor.value = preset.backgroundColor || "#111827";
    elements.textColor.value = preset.textColor || "#ffffff";
    elements.fontSize.value = String(preset.fontSize || 28);
    elements.replacementText.value = preset.text || "";
    savePreference(STORAGE_KEYS.backgroundColor, elements.backgroundColor.value);
    savePreference(STORAGE_KEYS.textColor, elements.textColor.value);
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    updatePreferenceLabels();
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

  function isImageFile(file) {
    return Boolean(file && file.type.startsWith("image/"));
  }

  function chooseFile() {
    elements.fileInput.click();
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
      image.onload = () => {
        const maxDimension = 12000;
        const maxPixels = 48_000_000;
        if (
          image.naturalWidth > maxDimension ||
          image.naturalHeight > maxDimension ||
          image.naturalWidth * image.naturalHeight > maxPixels
        ) {
          showToast("This image is too large. Use one under 48 megapixels.");
          return;
        }

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        baseCanvas.width = image.naturalWidth;
        baseCanvas.height = image.naturalHeight;
        baseContext.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        baseContext.drawImage(image, 0, 0);

        imageLoaded = true;
        imageName = (file.name || "pasted-image").replace(/\.[^.]+$/, "");
        selection = null;
        history = [];
        future = [];
        elements.emptyState.hidden = true;
        canvas.hidden = false;
        canvas.tabIndex = 0;
        elements.editControls.setAttribute("aria-disabled", "false");
        elements.downloadButton.disabled = false;
        elements.imageMeta.textContent = `${file.name || "Pasted image"} · ${image.naturalWidth} × ${image.naturalHeight} px`;
        elements.workspaceTip.textContent = "Drag a box · Enter applies";
        updateControls();
        render();
        canvas.focus({ preventScroll: true });
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
      const fontSize = Number(elements.fontSize.value);
      const horizontalPadding = Math.max(4, Math.min(fontSize * 0.42, selection.width * 0.08));
      targetContext.beginPath();
      targetContext.rect(selection.x, selection.y, selection.width, selection.height);
      targetContext.clip();
      targetContext.fillStyle = elements.textColor.value;
      targetContext.font = `600 ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue("--body")}`;
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

  function downloadImage() {
    if (!imageLoaded) return;
    baseCanvas.toBlob((blob) => {
      if (!blob) {
        showToast("The PNG could not be created.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${imageName}-patched.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("PNG downloaded.");
    }, "image/png");
  }

  function handleDrop(event) {
    event.preventDefault();
    elements.canvasWrap.classList.remove("is-dragging");
    elements.pasteCard.classList.remove("is-dragging");
    const file = [...event.dataTransfer.files].find(isImageFile);
    if (file) loadImageFile(file);
    else showToast("Drop an image file here.");
  }

  [elements.newImageButton, elements.replaceImageButton, elements.pasteCard, elements.emptyState].forEach((button) => {
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
  elements.downloadButton.addEventListener("click", downloadImage);
  elements.clearRecentButton.addEventListener("click", () => {
    if (!window.confirm("Clear all recent patch presets?")) return;
    recentPatches = [];
    savePreference(STORAGE_KEYS.recentPatches, "[]");
    renderRecentPatches();
    showToast("Recent patches cleared.");
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
  elements.fontSize.addEventListener("input", () => {
    updatePreferenceLabels();
    savePreference(STORAGE_KEYS.fontSize, elements.fontSize.value);
    render();
  });
  elements.replacementText.addEventListener("input", render);
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
      !event.target.matches("button, input[type='text']")
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

  initializePreferences();
  updateControls();
})();
