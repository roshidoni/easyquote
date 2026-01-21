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

  const ogImageMetaUrl = resolveUrl(getMetaContent('meta[property="og:image"]'));
  const twitterImageUrl = resolveUrl(getMetaContent('meta[name="twitter:image"]'));
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
      console.log("Quote Maker: image metadata", {
        ogImage: pageContext.ogImageMetaUrl,
        twitterImage: pageContext.twitterImageUrl,
        selectedImage: pageContext.ogImageUrl,
      });
      chrome.storage.local.set(
        {
          selectedQuote: info.selectionText,
          selectedAuthor: pageContext.author,
          selectedOgImage: pageContext.ogImageUrl || null,
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
      const pageContext = injectionResults?.[0]?.result ?? {
        author: null,
        selectedText: "",
      };
      console.log("Quote Maker: image metadata", {
        ogImage: pageContext.ogImageMetaUrl,
        twitterImage: pageContext.twitterImageUrl,
        selectedImage: pageContext.ogImageUrl,
      });
      sendResponse(pageContext);
    })
    .catch((e) => {
      console.log("Quote Maker: failed to probe page", e);
      sendResponse({ author: null, selectedText: "" });
    });

  return true;
});
