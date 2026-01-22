# EasyQuote - Quote Card Chrome Extension

A powerful Chrome extension that lets you create beautiful, shareable quote images from any webpage content. Similar to Substack's Restack quote feature, EasyQuote captures selected text and transforms it into visually appealing quote cards with author attribution and source URLs.

## Features

- **Smart Text Selection**: Select any text on a webpage and right-click to create a quote
- **Automatic Author Detection**: Extracts author information from meta tags, Open Graph data, and JSON-LD structured data
- **URL Attribution**: Automatically includes the source webpage URL
- **Multiple Formats**: Generate quotes in both square (1:1) and vertical (9:16) formats
- **Beautiful Backgrounds**: Creates artistic blurred backgrounds for visual appeal
- **Easy Download**: Save generated quotes as PNG images
- **Context Menu Integration**: Quick access via right-click menu on selected text

## How It Works

### Technical Implementation

EasyQuote uses a multi-component architecture:

1. **Content Script** (`content.js`):
   - Extracts author information from various meta tag formats
   - Parses JSON-LD structured data for author details
   - Handles communication between the popup and webpage

2. **Background Service Worker** (`background.js`):
   - Creates context menu items for text selection
   - Manages storage of selected quotes and author data
   - Handles popup opening from context menu

3. **Popup Interface** (`popup.html`, `popup.js`, `styles.css`):
   - Canvas-based quote generation with HTML5 Canvas API
   - Dynamic text wrapping and positioning
   - Blur effect background generation
   - Format selection (square/vertical)
   - Image download functionality

### Author Detection Algorithm

The extension uses a sophisticated author detection system that checks multiple sources:

```javascript
// Meta tag selectors for author information
const authorSelectors = [
  'meta[name="author"]',
  'meta[property="article:author"]', 
  'meta[property="og:article:author"]',
  'meta[name="twitter:creator"]',
  'meta[property="dc:creator"]'
];
```

If meta tags don't contain author information, the system falls back to parsing JSON-LD structured data commonly found in modern websites.

### Canvas Rendering

The quote generation uses HTML5 Canvas with:
- Dynamic sizing (800x800 for square, 1080x1920 for vertical)
- Blur filter effects for artistic backgrounds
- Smart text wrapping based on canvas dimensions
- Responsive font sizing for different formats

## Installation

### Developer Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/EasyQuote.git
   cd EasyQuote
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right

4. Click "Load unpacked" and select the EasyQuote folder

5. The extension will appear in your extensions list and toolbar

## Usage

### Method 1: Context Menu (Recommended)
1. Select any text on a webpage
2. Right-click and choose "Create Quote"
3. The popup will open with your selected text pre-filled
4. Adjust author if needed
5. Choose format (square or vertical)
6. Click "Generate Quote Image"
7. Download your beautiful quote image

### Method 2: Extension Popup
1. Click the EasyQuote icon in your toolbar
2. The current page URL will be auto-detected
3. Enter or paste your quote text
4. Add author name (auto-detected when possible)
5. Generate and download your quote

## File Structure

```
EasyQuote/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Quote generation logic
├── styles.css            # Popup styling
├── content.js            # Content script for author extraction
├── background.js         # Service worker for context menu
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Permissions Required

- **activeTab**: Access content of the current tab for text selection and author extraction
- **tabs**: Get current tab URL for attribution
- **contextMenus**: Create right-click menu options
- **storage**: Store selected quotes and author data temporarily
- **scripting**: Execute content scripts for author detection

## Browser Compatibility

- Chrome 88+ (Manifest V3 compatible)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## Development Notes

### Canvas Text Wrapping
The extension implements a custom text wrapping algorithm to ensure quotes fit properly within the canvas dimensions while maintaining readability.

### Background Generation
Artistic backgrounds are created using randomized blurred shapes with varying opacity levels for a professional appearance.

### Error Handling
The extension includes robust error handling for:
- Missing author information
- Invalid JSON-LD data
- Canvas rendering failures
- Storage access issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Substack's Restack quote feature
- Built with modern web technologies and Chrome Extension APIs
- Designed for content creators, readers, and social media enthusiasts
