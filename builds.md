# Builds

## Build Rule

- Build number uses plain integers from `1` to `999`, sorted by numeric order.
- Every code or documentation modification must record a new build.
- Bug fix updates the last version segment, for example `0.1.0` to `0.1.1`.
- Feature update updates the middle version segment, for example `0.1.0` to `0.2.0`.
- Major update updates the first version segment, for example `0.1.0` to `1.0.0`.
- Version update type must be declared by the user before recording a build.
- After each build is recorded, confirm the build number and version with the user.

## 63

- Date: 2026-08-18
- Version: 0.16.2
- Summary: Aligns selected control tabs and markers with the light and dark themes.
- Notes: Light mode uses black with white text; dark mode uses white with black text for selected tabs, markers, and the floating active marker.

## 62

- Date: 2026-08-18
- Version: 0.16.1
- Summary: Changes the selected tab in the control capsule to black.
- Notes: The black selected state applies only to the navigation, Chapter View, and settings tabs; marker highlighting is unchanged.

## 61

- Date: 2026-08-18
- Version: 0.16.0
- Summary: Consolidates navigation, Chapter View, and settings into one tabbed glass capsule.
- Notes: Adds SPA route lifecycle cleanup so the overlay is removed after leaving a supported route and rebuilt when returning.

## 60

- Date: 2026-08-17
- Version: 0.15.0
- Summary: Renames Explosion Mode to Chapter View and adds chapter/full-text copying.
- Notes: Fixes selected chapter chips being overridden by the right-rail active marker, and moves all modal actions into the content header.

## 59

- Date: 2026-08-17
- Version: 0.14.9
- Summary: Markers return to a 12pt-spaced document-order queue.
- Notes: Restores queue scrolling, the expanded wheel hit area and the floating active marker; clicking scrolls directly to its matching heading.

## 58

- Date: 2026-08-17
- Version: 0.14.8
- Summary: Markers now follow their mapped heading rows in the visible conversation.
- Notes: Replaces the scrollable queue with a DOM-positioned rail, hides off-screen headings, and keeps the legacy maximum-count preference only for backward compatibility.

## 57

- Date: 2026-08-17
- Version: 0.14.7
- Summary: Restores the marker queue and scrolls selected messages to the conversation top.
- Notes: Restores queue scrolling, floating active marker and height limit; clicking uses the containing AI message container, falling back to the heading.

## 56

- Date: 2026-08-17
- Version: 0.14.6
- Summary: Visible messages retain all of their markers.
- Notes: A marker stays eligible while its AI message is visible; its own heading DOM remains the position anchor and is clamped to the rail edge when off-screen.

## 55

- Date: 2026-08-17
- Version: 0.14.5
- Summary: Marker positions now follow their individual heading DOM targets.
- Notes: Replaces whole-message centering with the visible marker target's vertical center while retaining the message container as a layout-change observer.

## 54

- Date: 2026-08-17
- Version: 0.14.4
- Summary: Right-side markers now follow the visible AI message DOM.
- Notes: Groups markers at each message center, avoids collisions, limits dense views by the configured maximum, and updates positions on scroll and message resizing.

## 53

- Date: 2026-08-17
- Version: 0.14.3
- Summary: Markers no longer use soft drop shadows.
- Notes: Removes the shared glass shadow from regular and floating active markers while retaining their one-pixel glass border.

## 52

- Date: 2026-08-17
- Version: 0.14.2
- Summary: Navigation hover backgrounds now match the reset button hover state.
- Notes: Reuses the same shared hover fill for markers and top controls while preserving the active selection color.

## 51

- Date: 2026-08-17
- Version: 0.14.1
- Summary: Navigation control backgrounds now match the settings panel.
- Notes: Makes the inactive marker and top control backgrounds reuse the settings panel's shared glass background while preserving hover, active, and form-control surfaces.

## 50

- Date: 2026-07-06
- Version: 0.14.0
- Summary: Explosion mode now reuses marker sections across every supported platform.
- Notes: Switches section boundary detection from native DOM headings to the sorted `collectHeadings()` result so chips and adjacent reading blocks stay aligned on ChatGPT, Doubao, Kimi, Qianwen, Yuanbao, and Xiaohongshu Diandian.

## 49

- Date: 2026-07-06
- Version: 0.14.0
- Summary: Adds a full-screen explosion mode for selecting AI reply text.
- Notes: Reuses assistant container detection to collect only AI replies, opens from a control button or `Cmd/Ctrl+Shift+F`, locks background scroll, and supports copying the current text selection.

## 48

- Date: 2026-06-11
- Version: 0.13.4
- Summary: Marker tooltip text now wraps within the configured width.
- Notes: Replaces single-line ellipsis clipping with normal wrapping and long-word breaking while keeping the existing tooltip maximum width setting.

## 47

- Date: 2026-06-08
- Version: 0.13.3
- Summary: Typing in chat input no longer causes marker churn.
- Notes: Ignores mutations inside user input editors and the extension navigation root, and excludes editable input containers from assistant Markdown container collection.

## 46

- Date: 2026-06-07
- Version: 0.13.2
- Summary: Navigation controls remain visible when filters hide every marker.
- Notes: Keeps the toggle and settings controls available after marker filters produce an empty list, and restores the previous light-mode glass background variables while retaining the BoomBranch-like dark theme.

## 45

- Date: 2026-06-07
- Version: 0.13.1
- Summary: Global glass styling now follows a BoomBranch-like light and dark theme.
- Notes: Updates shared glass variables so markers, controls, settings, inputs, and tooltips use consistent translucent surfaces, subtle borders, and soft shadows across light and dark modes.

## 44

- Date: 2026-06-07
- Version: 0.13.0
- Summary: Unordered-list heading markers now have their own marker option.
- Notes: Adds a per-platform `enabledUnorderedListByPlatform` setting and `unordered-list` source type so unordered-list markers are no longer controlled by H3.

## 43

- Date: 2026-06-07
- Version: 0.12.1
- Summary: Xiaohongshu main-site AI chat now receives the Diandian content script.
- Notes: Adds `www.xiaohongshu.com` injection for SPA navigation into `/ai_chat`, keeps collection disabled on ordinary Xiaohongshu pages, and recognizes `xhs-ai-chat-page` chat containers used by the main-site Diandian page.

## 42

- Date: 2026-06-07
- Version: 0.12.0
- Summary: Xiaohongshu Diandian now supports H4 heading markers.
- Notes: Extends Diandian Markdown heading collection and marker settings to H1-H4, migrates old Diandian settings to enable H4 once, and preserves the previous limits for other platforms.

## 41

- Date: 2026-06-07
- Version: 0.11.1
- Summary: Xiaohongshu Diandian injection now covers the actual production domains.
- Notes: Adds `www.askdiandian.com` and `www.diandianlife.top` to extension matches, and includes deep research Markdown containers for Diandian pages.

## 40

- Date: 2026-06-07
- Version: 0.11.0
- Summary: Xiaohongshu Diandian and unordered list heading markers are now supported.
- Notes: Adds Diandian host injection with H1-H3 assistant Markdown markers, and recognizes clear unordered-list title items across platforms as level-3 markers.

## 39

- Date: 2026-06-07
- Version: 0.10.3
- Summary: Collapse toggle chevron now points up when expanded and down when collapsed.
- Notes: Fixes the default expanded state direction so the icon matches the "collapse all" action.

## 38

- Date: 2026-06-07
- Version: 0.10.2
- Summary: README now highlights the latest marker filtering and liquid glass features.
- Notes: Rewrites README into a concise GitHub-facing overview and updates the displayed version.

## 37

- Date: 2026-06-07
- Version: 0.10.1
- Summary: Settings menu controls now follow an Arco Design inspired style.
- Notes: Refines settings input, checkbox, reset button, spacing, text hierarchy, and hover states with Arco-like tokens while retaining the liquid glass menu shell.

## 36

- Date: 2026-06-07
- Version: 0.10.0
- Summary: Settings can filter marker heading levels per platform.
- Notes: Adds per-platform H1/H2/H3 marker type filters in the settings menu, preserves at least one enabled level, and migrates old configs with defaults.

## 35

- Date: 2026-06-07
- Version: 0.9.9
- Summary: Marker list wheel scrolling now uses the plugin maximum width as its hit area.
- Notes: Adds a non-click-blocking wheel hit test across the right-side plugin width so users can scroll the marker list without aiming directly at a marker pill.

## 34

- Date: 2026-06-05
- Version: 0.9.8
- Summary: Settings input focus and reset button strokes are removed.
- Notes: Removes the yellow focused outline from settings inputs and strips the glass outline stroke from the reset button.

## 33

- Date: 2026-06-05
- Version: 0.9.7
- Summary: Settings controls now better match the liquid glass styling.
- Notes: Removes the settings trigger outline stroke, sets settings inputs and reset button to #f5f5f5, and strengthens the settings menu glass material.

## 32

- Date: 2026-06-05
- Version: 0.9.6
- Summary: Marker list content now right-aligns with the collapse button.
- Notes: Keeps a right-side shadow buffer outside the marker content edge so marker pills align with the toggle while glass shadows remain unclipped.

## 31

- Date: 2026-06-05
- Version: 0.9.5
- Summary: Settings button hover now matches the collapse button pale blue state.
- Notes: Reuses the collapse button hover color for the settings trigger to avoid the dark liquid-glass hover.

## 30

- Date: 2026-06-05
- Version: 0.9.4
- Summary: Inactive markers now use a white glass background.
- Notes: Replaces the grey inactive marker fill with a translucent white material to better match liquid glass styling.

## 29

- Date: 2026-06-05
- Version: 0.9.3
- Summary: Settings menu and inputs now participate in the liquid glass material.
- Notes: Adds the menu panel and settings inputs to the per-element liquid glass filter pipeline.

## 28

- Date: 2026-06-05
- Version: 0.9.2
- Summary: Marker list scrolling no longer clips marker glass shadows.
- Notes: Adds a compensated shadow buffer around the marker list scroll area.

## 27

- Date: 2026-06-05
- Version: 0.9.1
- Summary: Liquid glass now follows the nikdelvin data-URL displacement filter approach.
- Notes: Generates per-element SVG displacement filters from element size and observes glass controls with ResizeObserver.

## 26

- Date: 2026-06-05
- Version: 0.9.0
- Summary: Liquid glass styling now uses a local JS-injected SVG filter enhancement.
- Notes: Adds a hidden SVG filter with turbulence, displacement, and blur, while retaining the pure CSS glass fallback and avoiding WebGL, canvas, and third-party dependencies.

## 25

- Date: 2026-06-05
- Version: 0.8.1
- Summary: Marker pills and the collapse toggle no longer show grey outline strokes.
- Notes: Keeps the glass shadow and material blur while removing the 1px border-like stroke from marker and toggle surfaces.

## 24

- Date: 2026-06-05
- Version: 0.8.0
- Summary: Markers and navigation buttons now use pure CSS glass material styling.
- Notes: Adds backdrop blur, saturation, translucent fills, and inner highlights while preserving inactive, hover, and active color semantics.

## 23

- Date: 2026-06-05
- Version: 0.7.8
- Summary: Settings reset hover state now uses marker-like pale blue contrast.
- Notes: Applies the same visible hover/focus color in dark and light menu themes.

## 22

- Date: 2026-06-05
- Version: 0.7.7
- Summary: Active marker list scrolling now persists briefly after marker clicks.
- Notes: Re-applies active marker visibility while the host page settles, without permanently fighting manual marker-list scrolling.

## 21

- Date: 2026-06-05
- Version: 0.7.6
- Summary: Inactive markers now use one consistent default grey background.
- Notes: Removes per-item opacity variation while keeping hover and active colors unchanged.

## 20

- Date: 2026-06-05
- Version: 0.7.5
- Summary: Floating active marker clicks now keep a smooth page scroll effect.
- Notes: Preserves one-click behavior by starting page scrolling before marker-list scrolling and focus updates.

## 19

- Date: 2026-06-05
- Version: 0.7.4
- Summary: Floating active marker clicks now jump the page anchor immediately with one click.
- Notes: Runs the page anchor jump before marker-list scrolling and keeps focus from scrolling the page again.

## 18

- Date: 2026-06-05
- Version: 0.7.3
- Summary: Floating active marker now returns both the marker list and the page anchor to the selected heading.
- Notes: Keeps the selected marker active while off-screen and preserves the floating marker 20pt above the visible marker list bottom.

## 17

- Date: 2026-06-05
- Version: 0.7.2
- Summary: Active marker selection now persists after click and uses the floating marker only when the selected marker leaves the screen.
- Notes: Positions the floating active marker 20pt above the visible marker list bottom.

## 16

- Date: 2026-06-05
- Version: 0.7.1
- Summary: Clicked marker highlighting now stays unique and persists while the marker list is scrolled.
- Notes: Uses internal marker keys for active matching and shows a clickable bottom floating active marker 20pt above the visible list bottom only when the active item is fully outside the browser viewport.

## 15

- Date: 2026-06-04
- Version: 0.7.0
- Summary: Marker lists now default to top-down display from below the page header.
- Notes: Removes automatic bottom scroll when headings are added.

## 14

- Date: 2026-06-04
- Version: 0.6.0
- Summary: Qianwen pages are supported with assistant body H1-H3 markers and first-video title markers.
- Notes: Adds `www.qianwen.com` and `qianwen.com` extension matches.

## 13

- Date: 2026-06-04
- Version: 0.5.0
- Summary: Kimi pages are supported with assistant body H1-H2 markers.
- Notes: Adds `www.kimi.com` and `kimi.com` extension matches while excluding Kimi share page titles from markers.

## 12

- Date: 2026-06-04
- Version: 0.4.0
- Summary: Yuanbao pages are supported with H1-H2 body markers and video big-card title markers.
- Notes: Adds `yb.tencent.com` and `yuanbao.tencent.com` extension matches.

## 11

- Date: 2026-06-04
- Version: 0.3.2
- Summary: Settings menu hover guard keeps the menu open while moving through the left-side blank area.
- Notes: Bug fix for premature menu close when moving from the settings trigger toward the settings menu.

## 7

- Date: 2026-06-03
- Version: 0.1.0
- Summary: MIT license added, changes published to GitHub, and release zip prepared.
- Notes: Release tag is `v0.1.0-build.7`.

## 6

- Date: 2026-06-03
- Version: 0.1.0
- Summary: Version/build text is placed to the right of sync status with `12pt` spacing.
- Notes: Version unchanged because no version update type was declared for this layout adjustment.

## 5

- Date: 2026-06-03
- Version: 0.1.0
- Summary: Settings menu shows the loaded extension version and build.
- Notes: The value comes from Manifest `version_name`.

## 4

- Date: 2026-06-03
- Version: 0.1.0
- Summary: Settings menu is layered above heading markers.
- Notes: Version unchanged because no version update type was declared for this overlay fix.

## 3

- Date: 2026-06-03
- Version: 0.1.0
- Summary: Sync status labels now read `同步已启用` and `同步未启用`.
- Notes: Version unchanged because no version update type was declared for this text-only change.

## 2

- Date: 2026-06-03
- Version: 0.1.0
- Summary: Settings menu shows `chrome.storage.sync` availability status.
- Notes: Green `同步已启用` means sync storage access succeeded; grey `同步未启用` means unavailable or failed.

## 1

- Date: 2026-06-03
- Version: 0.1.0
- Summary: Polaris for Web now persists front-end settings through `chrome.storage.sync`.
- Notes: Reload the unpacked extension in each browser after pulling this code build.
