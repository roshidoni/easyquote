document.addEventListener('DOMContentLoaded', function() {
  const generateBtn = document.getElementById('generate');
  const downloadBtn = document.getElementById('download');
  const resultDiv = document.getElementById('result');
  const canvas = document.getElementById('quoteCanvas');
  const ctx = canvas.getContext('2d');
  const urlInput = document.getElementById('url');
  const quoteInput = document.getElementById('quote');
  const authorInput = document.getElementById('author');

  // Get current tab URL and author
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    urlInput.value = currentTab.url;

    // Try to execute content script to get selection and author
    chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      function: () => {
        const getAuthorFromMeta = () => {
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
          return null;
        };

        return {
          selectedText: window.getSelection().toString(),
          author: getAuthorFromMeta()
        };
      }
    }).then((injectionResults) => {
      if (injectionResults && injectionResults[0].result) {
        const { selectedText, author } = injectionResults[0].result;
        if (selectedText) {
          quoteInput.value = selectedText.trim();
        }
        if (author) {
          authorInput.value = author;
        }
      }
    }).catch(console.log);
  });

  generateBtn.addEventListener('click', generateQuoteImage);
  downloadBtn.addEventListener('click', downloadImage);

  // Update canvas preview size based on format
  document.querySelectorAll('input[name="format"]').forEach(radio => {
    radio.addEventListener('change', function() {
      canvas.style.aspectRatio = this.value === 'square' ? '1 / 1' : '2 / 3';
    });
  });

  function generateQuoteImage() {
    const quote = quoteInput.value;
    const author = authorInput.value;
    const url = urlInput.value;
    const format = document.querySelector('input[name="format"]:checked').value;

    if (!quote || !author) {
      alert('Please enter both quote and author');
      return;
    }

    // Set canvas size based on format
    if (format === 'square') {
      canvas.width = 800;
      canvas.height = 800;
    } else {
      canvas.width = 1080;
      canvas.height = 1920;
    }

    // Fill with black background first
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create background with blur effect
    ctx.filter = 'blur(10px)';
    
    // Draw some dark gray shapes that will be blurred
    for (let i = 0; i < 5; i++) {
      // Using dark grays with low opacity for subtle effect
      ctx.fillStyle = `rgba(60, 60, 60, 0.6)`;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 400 + 200;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset blur for text
    ctx.filter = 'none';
    ctx.textAlign = 'center';
    
    // Calculate positions
    const startY = format === 'square' ? canvas.height * 0.35 : canvas.height * 0.35;
    const authorY = format === 'square' ? canvas.height * 0.65 : canvas.height * 0.65;
    const urlY = format === 'square' ? canvas.height * 0.75 : canvas.height * 0.75;
    const maxWidth = format === 'square' ? canvas.width - 100 : canvas.width - 160;
    
    // Draw quote
    ctx.fillStyle = '#ffffff';
    ctx.font = format === 'square' ? 'bold 32px Arial' : 'bold 48px Arial';
    wrapText(ctx, `"${quote}"`, canvas.width/2, startY, maxWidth, format === 'square' ? 40 : 60);

    // Draw author
    ctx.font = format === 'square' ? '24px Arial' : '36px Arial';
    ctx.fillText(`- ${author}`, canvas.width/2, authorY);

    // Draw URL if provided
    if (url) {
      ctx.font = format === 'square' ? '18px Arial' : '28px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(url, canvas.width/2, urlY);
    }

    resultDiv.classList.remove('hidden');
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }

  function downloadImage() {
    const link = document.createElement('a');
    link.download = 'quote.png';
    link.href = canvas.toDataURL();
    link.click();
  }
}); 