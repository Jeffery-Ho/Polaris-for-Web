# Polaris for Web

A browser extension that adds section navigation to AI-generated web responses.

Polaris for Web automatically detects headings and list titles in AI responses and displays navigation markers along the right edge of the page. Click a marker to jump directly to the corresponding section—ideal for reading long answers, reports, step-by-step guides, and research results.

## Supported Platforms

- ChatGPT
- Claude.ai
- Doubao
- Kimi
- Qianwen
- Yuanbao
- Xiaohongshu Diandian AI

## Marker Rules

- Automatically detects H1, H2, H3, and H4 headings according to platform-specific rules.
- Detects headings in unordered lists across all supported platforms, controlled by a separate **Unordered Lists** setting.
- Detects ordered-list titles when the separate **Ordered list** setting is enabled; it is disabled by default on every platform.
- Detects standalone bold text and bold-first list titles when the separate **Bold text** setting is enabled; it is disabled by default on every platform.
- Detects every visible response table across all supported platforms as one H3-level marker, titled from its first row's non-empty cells; every Maker locates the nearest conversation scroll container and preserves space for the fixed header.
- Kimi and Yuanbao display H1 and H2 markers by default.
- ChatGPT, Claude.ai, Doubao, and Qianwen display H1, H2, and H3 markers by default.
- Xiaohongshu Diandian AI displays H1, H2, H3, and H4 markers by default.
- Video titles in Qianwen video lists and Yuanbao large video cards can also appear as markers.

## Features

- Maker navigation is generated only from currently mounted user and AI response DOM. A route change removes the previous list immediately; only a later non-Polaris page mutation can populate the new list. DOM removal also removes its Makers, and a DOM remount receives new runtime keys.
- Progressive Maker rendering begins during streaming output as soon as the first non-empty supported marker is available; fixed 120ms render batches reuse existing Maker nodes and update only changed items, preserving list scrolling, focus, hover, and manual collapse state. Wheel, trackpad, or list-drag input on a Maker or group card immediately takes control from temporary Active Maker positioning, so any Maker can remain outside the list viewport while streaming continues.
- Click-to-jump navigation, active-section highlighting, and a scrollable marker queue.
- Visible titles inside AI markers, user groups, and the floating active marker are left-aligned; user group capsules remain on the queue's right edge while AI markers and folded stacks remain on the left.
- Platform-specific marker filters for H1, H2, H3, H4, bold text, unordered lists, and ordered lists.
- Settings synchronization through `chrome.storage.sync`.
- Settings preserve their internal scroll position during host-page refreshes, so long conversations do not interrupt access to Marker filters.
- Light and dark adaptive glass styling, with lightweight blur and saturation on Maker cards and the floating Active Maker while controls and search retain the full displacement effect.
- Native browser scrolling on Maker, user-group, and fold cards, without custom wheel animation or a transparent extended hit area.
- Fuzzy title search for both the navigation marker queue and Chapter View, with `Cmd/Ctrl+F` focusing the current search box.
- Long marker queues are grouped into stacks of `N` markers (default 20). Each stack starts expanded and shows its first title with the remaining count; clicking its card manually collapses or expands the Maker rows.
- Currently mounted user maker groups show the latest 20 groups by default, with search covering those mounted groups. Every group starts expanded, including the latest, previous, and newly streamed groups; an explicit click can manually collapse its contents.
- An active Maker does not change its stack or user group state. Manual collapse keeps the Maker selected, and dragging more than 4px from any Maker or group card scrolls the list without triggering that card's click action.
- **Chapter View**, which organizes AI response content by marker section for convenient reading and copying on every supported platform.
- A heart-shaped support entry at the right edge of the About & Settings header, opening the [Polaris support page](https://jeffery-ho.github.io/polaris-landing/) in a new tab with a fixed Polaris source tag. The landing page loads optional GA4 support-interaction analytics only after the visitor explicitly consents.
- While Chapter View is open, its modal blocks arrow, Home, and End keys from changing the underlying main tab; `Shift + ← / →` continues to switch chapters outside editable fields.
- Chapter View safely preserves rendered Markdown structure, including headings, nested and task lists, quotes, code, links, images, and wide tables.
- Complete raw Markdown pipe tables are also formatted in Chapter View when a source page leaves them unrendered.

## Settings

Open **Settings** from the control area on the right to adjust:

- Maximum number of visible markers
- User group limit
- Fold group size
- Tooltip width
- H1, H2, H3, H4, bold-text, unordered-list, and ordered-list marker visibility for the current platform

Preferences are saved to `chrome.storage.sync`.

## Chapter View

- Click **Chapter View** in the control area on the right, or press `Cmd/Ctrl+Shift+F`.
- Available on every supported platform: ChatGPT, Claude.ai, Doubao, Kimi, Qianwen, Yuanbao, and Xiaohongshu Diandian AI.
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

Polaris for Web processes only currently mounted AI response content locally in your browser and does not transmit it to the developer or third-party servers. It does not retain Maker conversation history across page refreshes, routes, or DOM removal. The separate support page only loads optional Google Analytics after the visitor explicitly consents, and never sends AI conversation content or extension settings. See the [Privacy Policy](https://jeffery-ho.github.io/Polaris-for-Web/privacy-policy.html) for details.

## Support

Visit the [Polaris support page](https://jeffery-ho.github.io/polaris-landing/) for the extension, issue tracker, and optional PayPal support link.

## Build on another device

The repository tracks the source, build configuration, dependency lockfile, tests, and the latest `dist/` release bundle. On a new device, install a Node.js version supported by `package.json`, then run:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Load the generated `dist/` directory as an unpacked extension in Chromium-based browsers. Do not use `dist.zip` as a source artifact; create a new archive from the freshly generated `dist/` directory only when a store upload requires it.

## Version

Current version: `0.47.0(191)`

## License

MIT
