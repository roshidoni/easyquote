const ensureContextMenu = () => {
  const menus = browser.contextMenus;
  if (!menus) {
    console.error("Context menu API is unavailable.");
    ensureContextMenu();
  }

  const menuConfig = {
    id: "createQuote",
    title: "Create Quote",
    contexts: ["page", "selection"],
  };

  menus.create(menuConfig, () => {
    if (!chrome.runtime.lastError) return;
    const message = chrome.runtime.lastError.message || "";
    if (message.toLowerCase().includes("already exists")) return;
    console.error("Failed to create context menu:", message);
  });
};

chrome.runtime.onInstalled.addListener(ensureContextMenu);
chrome.runtime.onStartup.addListener(ensureContextMenu);
ensureContextMenu();

function pageContextProbe() {
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    'meta[property="og:article:author"]',
    'meta[name="twitter:creator"]',
    'meta[property="dc:creator"]',
  ];

  const getMetaContent = (selector) => {
    const metaTag = document.querySelector(selector);
    return metaTag?.content?.trim() || null;
  };

  const resolveUrl = (rawUrl) => {
    if (!rawUrl) return null;
    try {
      return new URL(rawUrl, document.baseURI).href;
    } catch (e) {
      return rawUrl;
    }
  };

  const ogImageMetaUrl = resolveUrl(
    getMetaContent('meta[property="og:image"]'),
  );
  const twitterImageUrl = resolveUrl(
    getMetaContent('meta[name="twitter:image"]'),
  );
  const ogImageUrl = ogImageMetaUrl || twitterImageUrl;
  const imageContext = {
    ogImageUrl,
    ogImageMetaUrl,
    twitterImageUrl,
  };

  for (const selector of authorSelectors) {
    const metaTag = document.querySelector(selector);
    if (metaTag?.content) {
      return {
        author: metaTag.content.trim(),
        selectedText: window.getSelection().toString(),
        ...imageContext,
      };
    }
  }

  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd.textContent);
      if (data.author) {
        return {
          author:
            typeof data.author === "string" ? data.author : data.author.name,
          selectedText: window.getSelection().toString(),
          ...imageContext,
        };
      }
    } catch (e) {
      // invalid json, ignore
    }
  }

  return {
    author: null,
    selectedText: window.getSelection().toString(),
    ...imageContext,
  };
}

const menusApi = browser?.contextMenus || chrome?.contextMenus;
if (menusApi?.onClicked) {
  menusApi.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== "createQuote") return;

    chrome.tabs.executeScript(
      tab.id,
      {
        code: `(${pageContextProbe.toString()})()`,
      },
      (results) => {
        if (chrome.runtime.lastError) return;
        const pageContext = results?.[0] ?? { author: null };
        chrome.storage.local.set(
          {
            selectedQuote: info.selectionText,
            selectedAuthor: pageContext.author,
            selectedOgImage: pageContext.ogImageUrl || null,
          },
          () => {
            const popupUrl = chrome.runtime.getURL("popup.html");
            if (chrome.windows?.create) {
              chrome.windows.create({
                url: popupUrl,
                type: "popup",
                width: 420,
                height: 640,
              });
            } else if (chrome.tabs?.create) {
              chrome.tabs.create({ url: popupUrl });
            }
          },
        );
      },
    );
  });
} else {
  console.error("Context menu click listener unavailable.");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "getPageContext") return;

  const targetTabId = request.tabId || sender.tab?.id;
  if (!targetTabId) {
    sendResponse({ author: null, selectedText: "" });
    return;
  }

  chrome.tabs.executeScript(
    targetTabId,
    {
      code: `(${pageContextProbe.toString()})()`,
    },
    (results) => {
      if (chrome.runtime.lastError) {
        sendResponse({ author: null, selectedText: "" });
        return;
      }
      const pageContext = results?.[0] ?? {
        author: null,
        selectedText: "",
      };
      sendResponse(pageContext);
    },
  );

  return true;
});
