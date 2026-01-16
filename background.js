// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "createQuote",
    title: "Create Quote",
    contexts: ["selection"],
  });
});

function pageContextProbe() {
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    'meta[property="og:article:author"]',
    'meta[name="twitter:creator"]',
    'meta[property="dc:creator"]',
  ];

  for (const selector of authorSelectors) {
    const metaTag = document.querySelector(selector);
    if (metaTag?.content) {
      return {
        author: metaTag.content.trim(),
        selectedText: window.getSelection().toString()
      };
    }
  }

  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd.textContent);
      if (data.author) {
        return {
          author: typeof data.author === "string" ? data.author : data.author.name,
          selectedText: window.getSelection().toString()
        };
      }
    } catch (e) {
      // invalid json, ignore
    }
  }

  return {
    author: null,
    selectedText: window.getSelection().toString()
  };
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "createQuote") return;

  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: pageContextProbe,
    })
    .then((injectionResults) => {
      const pageContext = injectionResults?.[0]?.result ?? { author: null };
      chrome.storage.local.set(
        {
          selectedQuote: info.selectionText,
          selectedAuthor: pageContext.author
        },
        () => {
          chrome.action.openPopup();
        },
      );
    })
    .catch((e) => console.log("Quote Maker: failed to fetch author", e));
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "getPageContext") return;

  const targetTabId = request.tabId || sender.tab?.id;
  if (!targetTabId) {
    sendResponse({ author: null, selectedText: "" });
    return;
  }

  chrome.scripting
    .executeScript({
      target: { tabId: targetTabId },
      func: pageContextProbe,
    })
    .then((injectionResults) => {
      const pageContext = injectionResults?.[0]?.result ?? { author: null, selectedText: "" };
      sendResponse(pageContext);
    })
    .catch((e) => {
      console.log("Quote Maker: failed to probe page", e);
      sendResponse({ author: null, selectedText: "" });
    });

  return true;
});

