# Polaris for Web Guidelines

## Heading Marker Rule

- Only recognize and render `gpt-paragraph-nav__marker level-1`, `level-2`, and `level-3`.
- Do not recognize, count, or render `level-4` markers.
- `usableHeadings` must contain only heading items whose `level <= 3`.
- Future changes to heading extraction must preserve this rule unless the user explicitly asks to change it.
- Kimi pages must only render assistant Markdown body headings up to `H2`.
- Kimi share page titles such as `.share-title` must not render as markers.
- Qianwen pages may render assistant Markdown body headings up to `H3`.
- Qianwen video lists may render one `level-2` marker using the first visible video title only.
- Yuanbao pages must only render Markdown body headings up to `H2`.
- Yuanbao video big-card titles may render as `level-2` markers.

## Assistant Container Rule

- Detect the current chat site from `window.location.hostname`.
- Do not add a manual UI switch for choosing the assistant container source.
- Use site-specific assistant containers first, then fall back to generic Markdown containers.
- On Kimi, prefer assistant containers under `.segment-assistant .markdown`.
- On Qianwen, prefer assistant containers under `[class*="message-select-wrapper-answer"] .qk-markdown`.
- On Yuanbao, prefer AI response containers under `data-conv-speaker="ai"` and include `hyc-common-markdown` content plus video big-card titles.

## Floating Tooltip Rule

- The marker list must default to top-down display from below the page header.
- Do not auto-scroll the marker list to the bottom during initial render or heading growth.
- The right-side navigation container must leave enough horizontal room for marker tooltips.
- Do not constrain the list to marker width if tooltip labels need to extend left into the page.
- Transparent layout space must not block clicks in the ChatGPT content area.
- Inactive markers must use one consistent translucent white glass background without per-item opacity variation.
- Marker and navigation button glass styling must use pure CSS only: translucent backgrounds, `backdrop-filter`, `-webkit-backdrop-filter`, border highlights, and shadows. Do not add external libraries, JS filters, or SVG filters for this effect unless explicitly requested.
- Settings menu panels and settings inputs should use the same liquid glass material family as markers and navigation buttons.
- Settings trigger must not show the glass-mode 1px outline stroke.
- Settings inputs and the settings reset button should use `#f5f5f5` as their default background.
- Settings inputs must not show a separate focus outline.
- The settings reset button must not show the glass-mode 1px outline stroke.
- Settings menu panels should use a stronger liquid glass treatment than compact buttons through higher blur/saturation and menu-specific glass shadow.
- Settings menu form controls should follow an Arco Design inspired style: compact 32px inputs/buttons, 6px radius, light border tokens, blue checkbox selected state, and subtle grey hover fills.
- Liquid glass enhancement must use only a local JS-generated SVG data-URL filter with pure CSS glass fallback; do not add external libraries, remote scripts, WebGL, canvas, or html2canvas unless explicitly requested.
- Liquid glass displacement should follow the nikdelvin-style per-element data-URL SVG filter, recomputed from element size with `ResizeObserver`.
- Marker pills, floating active markers, and the collapse toggle must not show a grey 1px outline stroke in glass mode.
- Keep marker hover in a pale blue tone, and marker selected state in a stronger blue, not orange.
- Only the clicked active marker may use the selected blue state.
- Active marker matching must use an internal marker key, not the heading DOM id.
- Marker focus must not add a separate visual highlight.
- Marker type filtering must be saved per platform with fixed keys `chatgpt`, `doubao`, `kimi`, `qianwen`, `yuanbao`, and `default`.
- Marker type filtering is based on heading levels H1/H2/H3 only; do not mix it with heading source types unless explicitly requested.
- Marker type filtering must keep at least one enabled level for the current platform.
- If the active marker is fully outside the browser viewport, show one clickable floating active marker 20pt above the bottom of the visible marker list.
- Clicking the floating active marker must return the marker list to the selected marker and jump the page anchor to the selected heading.
- Floating active marker clicks must start page anchor scrolling before scrolling or focusing the marker list.
- Marker and floating marker clicks may briefly re-apply active marker list scrolling while the host page settles, but must not permanently override manual marker-list scrolling.
- Marker list content must right-align with the collapse toggle, while any shadow buffer expands outside that content edge.
- Marker list scroll containers must leave compensated padding for marker glass shadows so shadows are not visibly clipped.
- Marker list wheel scrolling should use the right-side plugin maximum width as its hit area without enabling transparent click interception.
- Keep the settings menu layered above heading markers.
- The settings menu may use a limited transparent hover guard while open; it must not intercept page clicks when the menu is closed.

## Toggle Button Rule

- The collapse toggle should include the extension icon in a 32px shell, using a 96px image resource for high-density displays.
- Keep the icon decorative for assistive technology; the button label comes from the action text and `aria-expanded`.
- Keep the collapse toggle background in a pale blue, Polaris-like tone, separate from the settings trigger color.

## Config Storage Rule

- Persist front-end settings in `chrome.storage.sync` with `gpt-paragraph-nav-config`.
- Use one shared config for all supported sites.
- Show sync status in the settings menu: green dot with `同步已启用` after successful sync storage access, grey dot with `同步未启用` when unavailable or failed.
- Show the loaded extension `version_name` in the settings menu as read-only version/build information.
- Place version/build text to the right of sync status with `12pt` spacing.
- When sync config is empty, migrate valid legacy `localStorage` config without deleting the legacy value.
- The settings reset button hover/focus state must remain visible on light menus and may reuse the marker hover pale blue.

## Version And Build Rule

- Build number uses plain integers from `1` to `999`, sorted by numeric order.
- Every code or documentation modification must record a new build.
- Bug fix updates the last version segment, feature update updates the middle segment, and major update updates the first segment.
- Ask the user to declare the update type before changing the version.
- After each build is recorded, confirm the build number and version with the user.
