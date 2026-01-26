# BlueQuote

BlueQuote is an open-source Chrome extension that turns selected web text into elegant quote cards. It emphasizes clean typography, minimal UI, and one-click export so creators can share highlights without extra tooling.

## Why BlueQuote

- **Elegant output**: Modern typography and subtle gradients for a premium feel
- **Zero configuration**: Sensible defaults with quick adjustments when you need them
- **Context-aware**: Automatically captures author and source URL when available
- **Portable**: Exports crisp PNGs that look great on any screen

## Features

- **Smart text selection**: Select any text and generate a quote from the context menu
- **Automatic author detection**: Reads meta tags, Open Graph, and JSON-LD
- **URL attribution**: Captures the source page for proper credit
- **Multiple formats**: Square (1:1) and vertical (9:16)
- **Canvas rendering**: Dynamic text wrapping and responsive font sizing
- **Instant download**: Save the result as a PNG with one click

## Installation

### From source (developer mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/roshidoni/BlueQuote.git
   cd BlueQuote
   ```
2. Open `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.

## Usage

### Context menu (recommended)

1. Highlight any text on a page.
2. Right-click and choose **Create Quote**.
3. Adjust the author or format if needed.
4. Click **Generate Quote Image** and download.

### Extension popup

1. Click the BlueQuote icon in the toolbar.
2. Paste your quote, and optionally edit the author.
3. Generate and download your image.

## Project layout

```
BlueQuote/
├── manifest.json
├── popup.html
├── popup.js
├── styles.css
├── content.js
├── background.js
└── icons/
```

## Architecture overview

- `content.js`: Extracts author metadata and coordinates with the popup
- `background.js`: Registers context menu entries and manages storage
- `popup.html` + `popup.js`: Renders and exports the quote canvas

## Permissions

- `activeTab`: Read selection and metadata from the current page
- `tabs`: Access the current tab URL for attribution
- `contextMenus`: Add the right-click entry
- `storage`: Preserve selected quote data between views
- `scripting`: Execute the author detection script

## Browser support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Contributing

Contributions are welcome. Please open an issue for new features or larger changes so we can align on direction.

1. Fork the repo and create a branch: `git checkout -b feature/my-change`
2. Make updates and test via **Load unpacked**
3. Commit with a clear message
4. Push and open a pull request

## License

MIT License. See `LICENSE` for details.

## Acknowledgments

- Inspired by Substack's Restack quote feature
- Built with Chrome Extension APIs and modern web technologies
