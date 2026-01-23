document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const UI = {
    downloadBtn: document.getElementById("download"),
    copyBtn: document.getElementById("copy"),
    resultDiv: document.getElementById("result"),
    quoteCard: document.getElementById("quoteCard"),
    quoteText: document.getElementById("quoteText"),
    quoteAuthor: document.getElementById("quoteAuthor"),
    quoteUrl: document.getElementById("quoteUrl"),
    quoteInput: document.getElementById("quote"),
    wordCount: document.getElementById("wordCount"),
    statusMessage: document.getElementById("status"),
    formatInputs: document.querySelectorAll('input[name="format"]'),
    quoteIcon: document.getElementById("quoteIcon"),
    backgroundButtons: document.querySelectorAll(".bg-toggle-btn"),
  };

  let currentQuoteIcon = null;
  let currentAuthor = "";
  let currentUrl = "";
  let currentOgImage = "";
  let currentOgImageDataURL = "";
  let isSelectionQuote = false;
  let backgroundMode = "dark";

  // --- Constants ---
  const WORD_LIMITS = { square: 60, vertical: 75 };

  const countWords = (text) =>
    text.split(/\s+/).filter((w) => w.length > 0).length;

  const extractDomain = (url) => url.replace(/^(https?:\/\/)?(www\.)?/i, "");

  function truncateTextByWordLimit(text, maxWords) {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    return words.length <= maxWords
      ? text
      : words.slice(0, maxWords).join(" ") + "...";
  }

  function calculateQuoteTextSize(wordCount, isVerticalFormat) {
    const base = 23;
    const modeMultiplier = isVerticalFormat ? 5 : 4;
    const value = (modeMultiplier - (Math.floor((wordCount - 1) / 15) + 1)) * 2;
    const fontSize = base + value;
    const lineHeight = isVerticalFormat ? 1.55 : 1.5;
    return { fontSize, lineHeight: lineHeight.toFixed(2) };
  }

  // --- Core Logic ---

  /**
   * @returns {"vertical" | "square"}
   */
  function getSelectedCardFormat() {
    // Get checked input value: square | vertical
    return document.querySelector('input[name="format"]:checked').value;
  }

  function getCurrentWordLimit() {
    return WORD_LIMITS[getSelectedCardFormat()];
  }

  function updateWordCountDisplay() {
    const inputText = UI.quoteInput.value.trim();
    const wordCount = countWords(inputText);
    const wordLimit = getCurrentWordLimit();

    if (inputText.length === 0) {
      UI.wordCount.classList.add("hidden");
      return;
    }

    UI.wordCount.classList.remove("hidden");
    UI.wordCount.textContent = `${wordCount} / ${wordLimit} words`;

    updateWordLimitIndicator(wordCount, wordLimit);
  }

  function updateWordLimitIndicator(wordCount, wordLimit) {
    UI.wordCount.classList.remove("warning", "limit");

    if (wordCount > wordLimit) {
      UI.wordCount.classList.add("limit");
    } else if (wordCount > wordLimit * 0.8) {
      UI.wordCount.classList.add("warning");
    }
  }

  function updateBackgroundToggle() {
    const hasImageBackground = isSelectionQuote && currentOgImage;
    if (!hasImageBackground) {
      backgroundMode = "dark";
    }

    UI.backgroundButtons.forEach((button) => {
      const mode = button.dataset.mode;
      const isImageButton = mode === "image";
      const shouldHide = isImageButton && !hasImageBackground;
      button.classList.toggle("hidden", shouldHide);
      button.setAttribute("aria-pressed", String(mode === backgroundMode));
    });
  }

  function renderQuoteCard() {
    const quoteText = UI.quoteInput.value.trim();
    const authorName = currentAuthor.trim();
    const sourceUrl = currentUrl;
    const cardFormat = getSelectedCardFormat();
    const isVerticalFormat = cardFormat === "vertical";

    if (!quoteText) {
      resetQuoteCard();
      return;
    }

    // Apply Content
    const wordLimit = getCurrentWordLimit();
    const truncatedQuote = truncateTextByWordLimit(quoteText, wordLimit);

    // Apply Styles
    UI.quoteCard.classList.toggle("vertical", isVerticalFormat);
    UI.quoteCard.classList.toggle("square", !isVerticalFormat);

    const { fontSize, lineHeight } = calculateQuoteTextSize(
      countWords(truncatedQuote),
      isVerticalFormat,
    );
    UI.quoteText.style.fontSize = `${fontSize}px`;
    UI.quoteText.style.lineHeight = `${lineHeight}`;

    UI.quoteText.textContent = truncatedQuote;
    UI.quoteAuthor.textContent = authorName;
    UI.quoteAuthor.classList.toggle("hidden", !authorName);
    UI.quoteUrl.textContent = sourceUrl ? extractDomain(sourceUrl) : "";

    // Render Icon
    UI.quoteIcon.innerHTML = "";
    if (currentQuoteIcon) {
      const img = document.createElement("img");
      img.src = currentQuoteIcon;
      img.alt = "";
      UI.quoteIcon.appendChild(img);
    }

    updateBackgroundToggle();

    const canUseImageBackground = isSelectionQuote && currentOgImage;
    const useImageBackground = canUseImageBackground && backgroundMode === "image";
    UI.quoteCard.classList.toggle("has-og-bg", useImageBackground);
    if (useImageBackground) {
      // Use the data URL if available to avoid CORS issues
      const imageUrl = currentOgImageDataURL || currentOgImage;
      UI.quoteCard.style.setProperty("--og-image", `url("${imageUrl}")`);
    } else {
      UI.quoteCard.style.removeProperty("--og-image");
    }

    // Show Result
    UI.resultDiv.classList.remove("hidden");
    UI.downloadBtn.disabled = false;
    UI.copyBtn.disabled = false;
  }

  // Helper to convert image URL to Data URL (base64)
  async function convertImageToDataURL(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  }

  function resetQuoteCard() {
    UI.quoteText.textContent = "";
    UI.quoteAuthor.textContent = "";
    UI.quoteAuthor.classList.add("hidden");
    UI.quoteUrl.textContent = "";
    UI.quoteIcon.innerHTML = "";
    UI.quoteCard.classList.remove("has-og-bg");
    UI.quoteCard.style.removeProperty("--og-image");
    currentOgImage = "";
    currentOgImageDataURL = "";
    isSelectionQuote = false;
    backgroundMode = "dark";
    updateBackgroundToggle();
    UI.resultDiv.classList.add("hidden");
    UI.downloadBtn.disabled = true;
    UI.copyBtn.disabled = true;
  }

  function onQuoteInputChange() {
    updateWordCountDisplay();

    const hasQuoteText = UI.quoteInput.value.trim().length > 0;

    if (hasQuoteText) {
      renderQuoteCard();
    } else {
      resetQuoteCard();
    }
  }

  // --- Actions ---
  async function renderQuoteToCanvas(scaleFactor) {
    if (!UI.quoteInput.value.trim()) {
      displayStatusMessage("Add a quote first.", true);
      return null;
    }
    if (typeof html2canvas !== "function") {
      displayStatusMessage("Library not loaded. Please reload.", true);
      return null;
    }

    try {
      const canvas = await html2canvas(UI.quoteCard, {
        backgroundColor: null,
        scale: scaleFactor,
        useCORS: true,
        allowTaint: true,
      });
      return canvas;
    } catch (error) {
      displayStatusMessage("Failed to generate image.", true);
      return null;
    }
  }

  async function handleDownloadClick() {
    setButtonLoadingState(UI.downloadBtn, true);
    const canvas = await renderQuoteToCanvas(2); // Scale 2 for download

    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) {
          displayStatusMessage("Could not create image blob.", true);
          setButtonLoadingState(UI.downloadBtn, false);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.download = "bluequote.jpeg";
        downloadLink.href = blobUrl;
        downloadLink.click();
        URL.revokeObjectURL(blobUrl);

        showButtonSuccessState(UI.downloadBtn);
        setButtonLoadingState(UI.downloadBtn, false);
      }, "image/jpeg");
    } else {
      setButtonLoadingState(UI.downloadBtn, false);
    }
  }

  async function handleCopyClick() {
    setButtonLoadingState(UI.copyBtn, true);
    const canvas = await renderQuoteToCanvas(3); // Scale 3 for sharper copy/paste

    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setButtonLoadingState(UI.copyBtn, false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          showButtonSuccessState(UI.copyBtn, "Copied!");
        } catch (err) {
          displayStatusMessage("Copy failed. Try downloading instead.", true);
        }
        setButtonLoadingState(UI.copyBtn, false);
      }, "image/png");
    } else {
      setButtonLoadingState(UI.copyBtn, false);
    }
  }

  // --- UI Feedback ---
  function setButtonLoadingState(button, isLoading) {
    const buttonText = button.querySelector(".btn-text");
    const buttonIcon = button.querySelector(".icon");

    button.disabled = isLoading;
    if (isLoading) {
      if (buttonIcon) buttonIcon.style.display = "none";
      const spinner = document.createElement("div");
      spinner.className = "spinner";
      button.insertBefore(spinner, buttonText);
    } else {
      const spinner = button.querySelector(".spinner");
      if (spinner) spinner.remove();
      if (buttonIcon) buttonIcon.style.display = "";
    }
  }

  function showButtonSuccessState(button, message = "Done!") {
    const buttonText = button.querySelector(".btn-text");
    const originalText = buttonText.textContent;

    button.classList.add("success");
    buttonText.textContent = message;

    setTimeout(() => {
      button.classList.remove("success");
      buttonText.textContent = originalText;
    }, 1500);
  }

  function displayStatusMessage(message, isError = false) {
    UI.statusMessage.textContent = message;
    UI.statusMessage.classList.toggle("hidden", !message);
    UI.statusMessage.classList.toggle("error", isError);

    if (message) {
      setTimeout(() => UI.statusMessage.classList.add("hidden"), 4000);
    }
  }

  // --- Event Listeners ---
  UI.downloadBtn.addEventListener("click", handleDownloadClick);
  UI.copyBtn.addEventListener("click", handleCopyClick);
  UI.quoteInput.addEventListener("input", onQuoteInputChange);

  UI.formatInputs.forEach((radio) => {
    radio.addEventListener("change", () => {
      updateWordCountDisplay();
      if (!UI.resultDiv.classList.contains("hidden")) {
        renderQuoteCard();
      }
    });
  });

  UI.backgroundButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      const canUseImageBackground = isSelectionQuote && currentOgImage;
      if (mode === "image" && !canUseImageBackground) return;
      backgroundMode = mode;
      updateBackgroundToggle();
      if (!UI.resultDiv.classList.contains("hidden")) {
        renderQuoteCard();
      }
    });
  });

  // --- Initialization ---
  updateBackgroundToggle();
  // Load data from storage (context menu)
  chrome.storage.local.get(
    ["selectedQuote", "selectedAuthor", "selectedOgImage"],
    (data) => {
      if (data.selectedQuote) UI.quoteInput.value = data.selectedQuote;
      if (data.selectedAuthor !== undefined)
        currentAuthor = data.selectedAuthor || "";
      if (data.selectedOgImage) {
        currentOgImage = data.selectedOgImage || "";
        if (currentOgImage) {
          convertImageToDataURL(currentOgImage).then((dataUrl) => {
            currentOgImageDataURL = dataUrl;
            if (backgroundMode === "image") renderQuoteCard();
          });
        }
      }

      if (data.selectedQuote || data.selectedAuthor || data.selectedOgImage) {
        isSelectionQuote = true;
        backgroundMode = "dark";
        updateBackgroundToggle();
        onQuoteInputChange();
        chrome.storage.local.remove([
          "selectedQuote",
          "selectedAuthor",
          "selectedOgImage",
        ]);
      }
    },
  );

  // Load data from current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    currentUrl = tabs[0].url || "";

    // Direct favicon retrieval from tab property
    if (tabs[0].favIconUrl) {
      currentQuoteIcon = tabs[0].favIconUrl;
    }

    onQuoteInputChange();

    chrome.runtime.sendMessage({ action: "getPageContext" }, (response) => {
      if (chrome.runtime.lastError) return;

      const { selectedText, author, ogImageUrl } = response || {};
      let hasNewData = false;

      if (selectedText) {
        UI.quoteInput.value = selectedText;
        isSelectionQuote = true;
        hasNewData = true;
      }
      if (author !== undefined) {
        if (author) {
          currentAuthor = author;
          hasNewData = true;
        } else if (!currentAuthor) {
          currentAuthor = "";
        }
      }
      if (ogImageUrl) {
        currentOgImage = ogImageUrl;
        convertImageToDataURL(ogImageUrl).then((dataUrl) => {
          currentOgImageDataURL = dataUrl;
          if (backgroundMode === "image") renderQuoteCard();
        });
        hasNewData = true;
      }

      if (selectedText || ogImageUrl) {
        backgroundMode = "dark";
        updateBackgroundToggle();
      }

      if (hasNewData) onQuoteInputChange();
    });
  });
});
