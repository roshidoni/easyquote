// Function to get author from meta tags
function getAuthorFromMeta() {
  // Common meta tag variations for author information
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

  // Try to find author in schema.org JSON-LD
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

function getFavicon() {
  const link = document.querySelector("link[rel*='icon']") || document.querySelector("link[rel='shortcut icon']");
  if (link) {
    const href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('/')) {
        return window.location.origin + href;
      }
      return link.href; // Returns absolute URL property
    }
  }
  return null;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelection") {
    sendResponse({
      selectedText: window.getSelection().toString(),
      author: getAuthorFromMeta(),
      icon: getFavicon()
    });
  }
  return true; // Required for async response
}); 