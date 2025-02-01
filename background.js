// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "createQuote",
    title: "Create Quote",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "createQuote") {
    // Execute script to get author information
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const authorSelectors = [
          'meta[name="author"]',
          'meta[property="article:author"]',
          'meta[property="og:article:author"]',
          'meta[name="twitter:creator"]',
          'meta[property="dc:creator"]'
        ];

        for (let selector of authorSelectors) {
          const metaTag = document.querySelector(selector);
          if (metaTag && metaTag.content) {
            return metaTag.content.trim();
          }
        }

        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
          try {
            const data = JSON.parse(jsonLd.textContent);
            if (data.author) {
              return typeof data.author === 'string' ? data.author : data.author.name;
            }
          } catch (e) {
            console.log('Error parsing JSON-LD:', e);
          }
        }

        return null;
      }
    }).then((injectionResults) => {
      const author = injectionResults[0].result;
      // Store both the selected text and author
      chrome.storage.local.set({ 
        selectedQuote: info.selectionText,
        selectedAuthor: author
      }, () => {
        // Open the popup
        chrome.action.openPopup();
      });
    });
  }
}); 