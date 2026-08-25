# Polaris for Web

A browser extension that adds section navigation to AI-generated web responses.

Polaris for Web automatically detects headings and list titles in AI responses and displays navigation markers along the right edge of the page. Click a marker to jump directly to the corresponding section—ideal for reading long answers, reports, step-by-step guides, and research results.

## Supported Platforms

- ChatGPT
- Doubao
- Kimi
- Qianwen
- Yuanbao
- Xiaohongshu Diandian AI

## Marker Rules

- Automatically detects H1, H2, H3, and H4 headings according to platform-specific rules.
- Detects headings in unordered lists across all supported platforms, controlled by a separate **Unordered Lists** setting.
- Detects every visible response table across all supported platforms as one H2-level marker, titled from its first row's non-empty cells.
- Kimi and Yuanbao display H1 and H2 markers by default.
- ChatGPT, Doubao, and Qianwen display H1, H2, and H3 markers by default.
- Xiaohongshu Diandian AI displays H1, H2, H3, and H4 markers by default.
- Video titles in Qianwen video lists and Yuanbao large video cards can also appear as markers.

## Features

- Click-to-jump navigation, active-section highlighting, and a scrollable marker queue.
- Platform-specific marker filters for H1, H2, H3, H4, and unordered lists.
- Settings synchronization through `chrome.storage.sync`.
- Light and dark adaptive glass styling for markers, buttons, and the settings panel.
- An expanded mouse-wheel hit area that makes the marker list easier to scroll.
- Fuzzy title search for both the navigation marker queue and Chapter View, with `Cmd/Ctrl+F` focusing the current search box.
- Long marker queues are grouped into stacks of `N` markers (default 20); each full group collapses into a stack card with its first title and remaining count.
- User maker groups show the latest 20 groups by default; earlier groups are available from an expandable summary, and search covers every group.
- ChatGPT user maker groups read the active conversation branch, so long virtualized conversations retain their historical user groups.
- **Chapter View**, which organizes AI response content by marker section for convenient reading and copying on every supported platform.
- Chapter View safely preserves rendered Markdown structure, including headings, nested and task lists, quotes, code, links, images, and wide tables.
- Complete raw Markdown pipe tables are also formatted in Chapter View when a source page leaves them unrendered.

## Settings

Open **Settings** from the control area on the right to adjust:

- Maximum number of visible markers
- User group limit
- Fold group size
- Tooltip width
- H1, H2, H3, H4, and unordered-list marker visibility for the current platform

Preferences are saved to `chrome.storage.sync`.

## Chapter View

- Click **Chapter View** in the control area on the right, or press `Cmd/Ctrl+Shift+F`.
- Available on every supported platform: ChatGPT, Doubao, Kimi, Qianwen, Yuanbao, and Xiaohongshu Diandian AI.
- Processes only AI response content on the current page; input fields, sidebars, and the extension's own interface are excluded.
- Rebuilds supported rendered Markdown with a strict element and URL allowlist; images load from existing `http`/`https` page URLs and open in a new tab when clicked.
- Formats unrendered raw Markdown text safely, including mixed inline styles, nested task lists, code blocks, tables, and Unicode characters; raw image syntax and HTML remain text.
- When a titled chapter has no extractable body, use **Go to original position** to close the modal and return to that chapter in the conversation.
- Displays the response in a medium-sized modal approximately `524pt` wide, with a translucent backdrop, and divides the content into sections using the platform's existing marker results.
- Use the modal search box, or press `Cmd/Ctrl+F` while the modal is open, to filter section chips by title and click a chip to switch sections.
- Horizontal section chips appear at the top of the modal. By default, the current section and its adjacent sections are displayed.
- **Copy current chapter**, **Copy full text**, and **Close** controls appear in the modal's upper-right corner.
- Press `Escape` or click **Close** to exit and restore page scrolling.

## Privacy

Polaris for Web processes AI response content locally in your browser and does not transmit it to the developer or third-party servers. See the [Privacy Policy](https://jeffery-ho.github.io/Polaris-for-Web/privacy-policy.html) for details.

## Version

Current version: `0.35.0(138)`

## License

MIT
