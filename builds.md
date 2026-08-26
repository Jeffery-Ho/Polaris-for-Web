# Builds

## Build Rule

- Build number uses plain integers from `1` to `999`, sorted by numeric order.
- Every code or documentation modification must record a new build.
- Bug fix updates the last version segment, for example `0.1.0` to `0.1.1`.
- Feature update updates the middle version segment, for example `0.1.0` to `0.2.0`.
- Major update updates the first version segment, for example `0.1.0` to `1.0.0`.
- Version update type must be declared by the user before recording a build.
- After each build is recorded, confirm the build number and version with the user.

## 147

- Date: 2026-08-26
- Version: 0.36.0
- Summary: Starts progressive Maker rendering as soon as streaming output contains its first valid marker.
- Notes: Relevant DOM mutations now enter a two-state scheduler that waits for a non-empty supported Maker, then renders the latest snapshot at most once per fixed 120ms window without sliding the first deadline. Route changes and extension invalidation reset the scheduler; empty headings no longer produce placeholder Makers. Run `pnpm test`, `pnpm check`, then `pnpm build`; confirm `dist/manifest.json` is `0.36.0(147)`, reload `dist/` in Tabbit Browser, and verify Makers appear before a long response finishes while editor mutations remain ignored.

## 146

- Date: 2026-08-26
- Version: 0.35.8
- Summary: Keeps safe viewport spacing and concise Maker titles in minimized control mode.
- Notes: Minimized navigation preserves the normal viewport inset. AI, user, folded, and floating Maker titles use a 160px single-line ellipsis while full labels and interactions remain unchanged; the user Maker pill reserves its 16px horizontal padding plus 14px for a non-shrinking 8px collapse chevron and gap, and a folded group can expand to 280px so its count, remainder, and chevron remain visible. Run `pnpm test`, then `pnpm build`, reload `dist/` in Dia, and verify title truncation, complete chevrons, hover labels, navigation, and restore behavior.

## 145

- Date: 2026-08-25
- Version: 0.35.7
- Summary: Ensures Dia's drag-click suppression never blocks Maker buttons.
- Notes: Even after a completed drag, capture-phase suppression clears its state but lets Maker clicks reach their navigation handlers. Run `pnpm test`, then `pnpm build`, reload `dist/` in Dia, and verify a distant normal heading and a table Maker jump.

## 144

- Date: 2026-08-25
- Version: 0.35.6
- Summary: Keeps Maker clicks separate from marker-list dragging in Dia.
- Notes: Pressing a Maker no longer initializes list dragging, so pointer movement cannot suppress its click; list dragging remains available from blank list space. Run `pnpm test`, then `pnpm build`, reload `dist/` in Dia, and verify a distant normal heading and a table Maker jump.

## 143

- Date: 2026-08-25
- Version: 0.35.5
- Summary: Restores Maker navigation inside Dia's conversation scroll container.
- Notes: All Maker types now calculate the nearest vertical conversation container target position, reserving the fixed-header height and safety gap; without an internal container, navigation falls back to `scrollIntoView`. Run `pnpm test`, then `pnpm build`, reload `dist/` in Dia, and verify both a table Maker and a normal heading Maker in the long ChatGPT conversation.

## 142

- Date: 2026-08-25
- Version: 0.35.4
- Summary: Restores navigation for duplicate table markers after a ChatGPT table rerender.
- Notes: A matching table at the original candidate index is now preferred before unique title-and-fingerprint fallback, so repeated identical tables remain jumpable. Run `pnpm test`, then `pnpm build`, reload `dist/` in Dia, and verify the target table in the long ChatGPT conversation.

## 141

- Date: 2026-08-25
- Version: 0.35.3
- Summary: Makes table markers follow the H3 filter instead of the incorrect H2 filter.
- Notes: On the verified ChatGPT conversation, H3 was enabled while H2 was disabled, so the prior H2 classification removed all ten recognized table markers. Run `pnpm test`, then `pnpm build` and reload `dist/`.

## 140

- Date: 2026-08-25
- Version: 0.35.2
- Summary: Keeps table marker navigation valid after marker filtering rerenders the page.
- Notes: A stale table marker target is resolved again by its title, content fingerprint, and current table-candidate index before scrolling; identical duplicate tables are not selected. Run `pnpm test`, then `pnpm build` and reload `dist/`.

## 139

- Date: 2026-08-25
- Version: 0.35.1
- Summary: Fixes table marker navigation inside conversation scroll containers.
- Notes: Table markers calculate the nearest vertical conversation container's target scroll position, reserving the existing fixed-header height and a safety gap; without such a container, navigation falls back to `scrollIntoView`. Run `pnpm test`, then `pnpm build` and reload `dist/`.

## 138

- Date: 2026-08-25
- Version: 0.35.0
- Summary: Adds one navigation marker for each visible AI response table across supported platforms.
- Notes: The marker title joins the first row's non-empty cells and respects the existing H2 visibility setting; tables with fewer than two populated first-row cells are ignored. Run `pnpm test`, then `pnpm build` and reload `dist/`.

## 137

- Date: 2026-08-25
- Version: 0.34.0
- Summary: Safely formats mixed raw Markdown and preserves Unicode in Chapter View.
- Notes: Raw text now supports common blocks, inline styles, nested task lists, and mixed table cells; raw HTML and image syntax remain text. Run `pnpm test`, then `pnpm build` and reload `dist/`.

## 136

- Date: 2026-08-25
- Version: 0.33.1
- Summary: Uses a more opaque same-color surface when AI maker groups are hovered.
- Notes: The count-fold group retains its original surface when expanded and increases only its same-color background opacity on hover; individual markers, user markers, tabs, and the floating active entry are unchanged. Run `pnpm check`, then `pnpm build` and reload `dist/`.

## 135

- Date: 2026-08-25
- Version: 0.33.0
- Summary: Formats complete raw Markdown pipe tables inside Chapter View.
- Notes: Only a header, delimiter row, and equal-width data rows are converted; incomplete text remains a paragraph. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 134

- Date: 2026-08-25
- Version: 0.32.0
- Summary: Lets empty Chapter View sections jump back to their source heading.
- Notes: The action closes the modal, restores page scrolling, and synchronizes the matching navigation marker. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 133

- Date: 2026-08-25
- Version: 0.31.0
- Summary: Expands Chapter View into a richer, safe Markdown reader.
- Notes: Chapters preserve headings, deletion, nested and task lists, images, and complex tables through a strict DOM and URL allowlist. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 132

- Date: 2026-08-25
- Version: 0.30.1
- Summary: Restores the Settings panel after dismissing its update-notes dialog.
- Notes: The manual entry preserves the active Settings tab while the dialog is open. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 131

- Date: 2026-08-25
- Version: 0.30.0
- Summary: Adds a settings entry for reopening the current feature-version update notes.
- Notes: The entry sits beside the loaded version and opens the same localized notice dialog without changing read status. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 130

- Date: 2026-08-25
- Version: 0.29.4
- Summary: Limits update notices to feature-version (`0.xx`) summaries.
- Notes: Patch releases remain in `builds.md` and `changelog.md` but do not create separate notice cards or prompts. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 129

- Date: 2026-08-25
- Version: 0.29.3
- Summary: Replaces update-notice feedback text actions with mail and GitHub icons.
- Notes: The icon buttons retain localized ARIA labels and hover tooltips. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 128

- Date: 2026-08-25
- Version: 0.29.2
- Summary: Shows release notes from the newest version to the oldest.
- Notes: The three-note limit remains unchanged; only the displayed order is reversed. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 127

- Date: 2026-08-25
- Version: 0.29.1
- Summary: Refines the version-update notice title, close control, and friendly visual cues.
- Notes: The title now includes a small sparkle icon, the feedback line includes an emoji cue, and the close xmark uses centered CSS strokes. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 126

- Date: 2026-08-25
- Version: 0.29.0
- Summary: Adds localized version-update notices with direct feedback actions.
- Notes: First installs and version upgrades show up to three recent release notes. Closing the dialog records the current version locally. Every release must add its bundled note to `src/release-notes.js`. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 125

- Date: 2026-08-25
- Version: 0.28.6
- Summary: Restores Doubao user maker groups after its sent-message DOM update.
- Notes: Polaris classifies the semantic `bg-g-send-msg-bubble-bg` bubble as an internal user message while retaining legacy selectors. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 124

- Date: 2026-08-25
- Version: 0.28.5
- Summary: Shows the unloaded-reply toast whenever a ChatGPT user group has no visible AI makers.
- Notes: The notice now follows the rendered child list, so every empty ChatGPT group provides feedback on click. Run `pnpm build` and load `dist/`.

## 123

- Date: 2026-08-25
- Version: 0.28.4
- Summary: Moves the global unloaded-reply glass toast to the top center.
- Notes: The toast enters from above and remains non-interactive. Run `pnpm build` and load `dist/`.

## 122

- Date: 2026-08-25
- Version: 0.28.3
- Summary: Styles unloaded-reply notices as a global glass toast.
- Notes: The toast is bottom-centered, theme-aware, non-interactive, and uses the same blur, border, and shadow language as navigation. Run `pnpm build` and load `dist/`.

## 121

- Date: 2026-08-25
- Version: 0.28.2
- Summary: Shows a notice when a ChatGPT history user group has no mounted reply DOM.
- Notes: The notice only applies to conversation-tree groups without AI heading DOM; other empty user groups retain their existing behavior. Run `pnpm build` and load `dist/`.

## 120

- Date: 2026-08-25
- Version: 0.28.1
- Summary: Restores the blue background for user maker groups in light page themes.
- Notes: The light-theme rule now preserves user maker and hover colors while active AI makers remain black. Run `pnpm build` and load `dist/`.

## 119

- Date: 2026-08-25
- Version: 0.28.0
- Summary: Makes maker-list scrolling continuous and follows the ChatGPT page visual theme.
- Notes: Native scrolling retains trackpad momentum inside the list; the outer hit area uses requestAnimationFrame animation. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 118

- Date: 2026-08-25
- Version: 0.27.1
- Summary: Reads the active ChatGPT conversation branch for long-conversation user groups.
- Notes: Historical user groups no longer depend on mounted DOM rows; only mounted assistant headings remain jumpable. Run `pnpm test`, then `pnpm build` and load `dist/`.

## 117

- Date: 2026-08-25
- Version: 0.27.0
- Summary: Adds a configurable first-screen limit for user maker groups.
- Notes: The latest 20 user groups remain visible by default; earlier groups expand from a single control, while search always includes every matching group. Run `pnpm build` and load `dist/`.

## 116

- Date: 2026-08-25
- Version: 0.26.13
- Summary: Keeps every user-message group visible in the AI maker navigation list.
- Notes: User groups without recognized AI heading makers remain as empty, collapsible rows; run `pnpm build` and load `dist/`.

## 115

- Date: 2026-08-24
- Version: 0.26.12
- Summary: Synchronizes the packaged extension name with the product name.
- Notes: The generated manifest now uses Polaris: AI Chat Navigator — Smart Headings & Quick Jump. Run `pnpm build` and load `dist/`.

## 114

- Date: 2026-08-24
- Version: 0.26.11
- Summary: Synchronizes the build manifest version with the release record.
- Notes: Both source manifests and the generated extension manifest use 0.26.11(114); run `pnpm build` and load `dist/`.

## 113

- Date: 2026-08-24
- Version: 0.26.10
- Summary: Softens the chapter search focus treatment and caps its width.
- Notes: The focused search field uses a theme-appropriate light gray surface and does not grow beyond 360px, preserving space around the action buttons. Run `pnpm build` and load `dist/`.

## 112

- Date: 2026-08-24
- Version: 0.26.9
- Summary: Keeps chapter tabs visible when the dialog shrinks to the viewport.
- Notes: The dialog now uses the available viewport height; only the chapter body scrolls while the header, tabs and shortcut hint remain visible. Run `pnpm build` and load `dist/`.

## 111

- Date: 2026-08-24
- Version: 0.26.8
- Summary: Lets the chapter dialog header size itself to its contents.
- Notes: The header no longer has a minimum height; its search field and actions determine the rendered height. Run `pnpm build` and load `dist/`.

## 110

- Date: 2026-08-24
- Version: 0.26.7
- Summary: Fixes chapter dialog overflow and keyboard event propagation.
- Notes: The dialog uses natural content height and the overlay scrolls on short viewports; Shift+Left/Right switches only chapters. Run `pnpm build` and load `dist/`.

## 109

- Date: 2026-08-23
- Version: 0.26.6
- Summary: Refines the rating card action and hover treatment.
- Notes: The action is black and spans the full card content width; hovering the card does not apply a dark border. Run `pnpm build` and load `dist/`.

## 108

- Date: 2026-08-23
- Version: 0.26.5
- Summary: Stacks the rating card and emphasizes its action.
- Notes: The prompt appears above a prominent full-width green Rate Now action; run `pnpm build` and load `dist/`.

## 107

- Date: 2026-08-23
- Version: 0.26.4
- Summary: Adds a local 24-hour dismissal to the rating card.
- Notes: Dismissal clears on extension reinstall and does not sync across devices; run `pnpm build` and load `dist/`.

## 106

- Date: 2026-08-23
- Version: 0.26.3
- Summary: Moves the rating card below the supported-platform description.
- Notes: The rating card now appears before the settings heading and configuration items; run `pnpm build` and load `dist/`.

## 105

- Date: 2026-08-23
- Version: 0.26.2
- Summary: Replaces the full-width reset control with a localized Chrome Web Store rating card.
- Notes: Reset moves into the settings title row as a compact control; run `pnpm build` and load `dist/`.

## 104

- Date: 2026-08-23
- Version: 0.26.1
- Summary: Reorganizes settings information and adds a supported-platform overview.
- Notes: The Header retains the Polaris identity, the Footer shows version and feedback actions, and the platform overview is localized. Run `pnpm build` and load `dist/`.

## 103

- Date: 2026-08-23
- Version: 0.26.0
- Summary: Adds keyboard chapter paging and a persistent shortcut hint.
- Notes: Shift+Left/Right cycles chapters outside editable fields; run `pnpm build` and load `dist/`.

## 102

- Date: 2026-08-23
- Version: 0.25.1
- Summary: Removes the visible settings synchronization status.
- Notes: Preferences continue to use Chrome Storage Sync internally; the footer now contains only feedback actions. Run `pnpm build` and load `dist/`.

## 101

- Date: 2026-08-23
- Version: 0.25.0
- Summary: Adds semantic Markdown and table rendering to chapter content.
- Notes: Preserves safe emphasis, code, links, quotes, lists and tables from AI responses; run `pnpm build` and load `dist/`.

## 100

- Date: 2026-08-23
- Version: 0.24.16
- Summary: Limits chapter dialog content to the selected chapter.
- Notes: Switching a chapter chip replaces the body instead of showing adjacent chapter content; run `pnpm build` and load `dist/`.

## 99

- Date: 2026-08-23
- Version: 0.24.15
- Summary: Combines chapter copy actions into a dropdown menu.
- Notes: The menu offers current-chapter and full-text copying, then closes after selection; Escape closes it before closing the dialog. Run `pnpm build` and load `dist/`.

## 98

- Date: 2026-08-23
- Version: 0.24.14
- Summary: Gives the chapter modal solid black-and-white theme backgrounds.
- Notes: Light mode uses white and dark mode uses near-black, while the overlay and controls retain their hierarchy; run `pnpm build` and load `dist/`.

## 97

- Date: 2026-08-23
- Version: 0.24.13
- Summary: Reduces chapter modal mask opacity in both themes.
- Notes: The background remains distinguishable without excessively darkening the page; run `pnpm build` and load `dist/`.

## 96

- Date: 2026-08-23
- Version: 0.24.12
- Summary: Makes the chapter modal use the same glass tokens as settings.
- Notes: The modal now shares the glass background, border, shadow and blur in both themes; run `pnpm build` and load `dist/`.

## 95

- Date: 2026-08-23
- Version: 0.24.11
- Summary: Aligns selected checkbox control borders with the selected state.
- Notes: The chip and check control use the same theme-highlight border; run `pnpm build` and load `dist/`.

## 94

- Date: 2026-08-23
- Version: 0.24.10
- Summary: Unifies settings control default borders with a theme-aware gray.
- Notes: Hover, selected and keyboard-focus highlights remain unchanged; run `pnpm build` and load `dist/`.

## 93

- Date: 2026-08-23
- Version: 0.24.9
- Summary: Removes default borders from slider tracks and unchecked checkboxes.
- Notes: Selected and keyboard-focus states remain visible; run `pnpm build` and load `dist/`.

## 92

- Date: 2026-08-23
- Version: 0.24.8
- Summary: Standardizes rectangular extension controls on 24pt corners.
- Notes: Pills, markers and icon buttons remain fully rounded; run `pnpm build` and load `dist/`.

## 91

- Date: 2026-08-23
- Version: 0.24.7
- Summary: Unifies rectangular controls with large corner radii.
- Notes: Pills and icon buttons remain fully rounded; run `pnpm build` and load `dist/`.

## 90

- Date: 2026-08-23
- Version: 0.24.6
- Summary: Makes the settings panel use the same glass tokens as the Tab capsule.
- Notes: The panel keeps its 14pt radius and layout, while the background, border, shadow and blur match the top controls. Run `pnpm build` and load `dist/`.

## 89

- Date: 2026-08-23
- Version: 0.24.5
- Summary: Restores the full-width native Hero-style reset button and smooth slider dragging.
- Notes: Slider progress updates locally while dragging, then applies and syncs on release. Run `pnpm build` and load `dist/`.

## 88

- Date: 2026-08-23
- Version: 0.24.4
- Summary: Restores the native settings panel glass surface and Hero-style control states.
- Notes: Keeps the native implementation and the smaller content bundle. Run `pnpm build` and load `dist/`.

## 87

- Date: 2026-08-22
- Version: 0.24.3
- Summary: Removes the HeroUI and React runtime from the settings panel.
- Notes: Native DOM controls preserve the existing glass design, keyboard focus, syncing and feedback links. Run `pnpm build` and load `dist/`.

## 86

- Date: 2026-08-22
- Version: 0.24.2
- Summary: Renames the About tab to About&Settings.
- Notes: Chinese uses “关于与设置”; the existing configuration panel remains unchanged. Run `pnpm build` and load `dist/`.

## 85

- Date: 2026-08-22
- Version: 0.24.1
- Summary: Replaces the feedback Issue document icon with the GitHub mark.
- Notes: The link, tooltip, aria label and circular HeroUI-style button remain unchanged; run `pnpm build` and load `dist/`.

## 84

- Date: 2026-08-22
- Version: 0.24.0
- Summary: Adds About feedback actions and stabilizes Xiaohongshu Diandian user-to-AI maker mapping.
- Notes: The original marker folding behavior remains unchanged; run `pnpm build` and load `dist/`.

## 83

- Date: 2026-08-22
- Version: 0.23.0
- Summary: Aligns settings panel and maker widths with the Tab control capsule and shows full maker titles within that width.
- Notes: Long titles wrap instead of being truncated; run `pnpm build` and load `dist/`.

## 82

- Date: 2026-08-22
- Version: 0.23.0
- Summary: Rebuilds the settings panel with HeroUI React components in an isolated Shadow DOM.
- Notes: Run `pnpm build` and load `dist/`; Slider changes apply immediately and synchronize on release.

## 81

- Date: 2026-08-22
- Version: 0.22.0
- Summary: Reworks the settings panel with fixed app and sync regions, slider controls, and unified theme highlights.
- Notes: The visible app name is Polaris; the Manifest name is unchanged; the displayed version format is `0.22.0(81)`.

## 80

- Date: 2026-08-22
- Version: 0.21.0
- Summary: Adds a compact control-capsule mode.
- Notes: Hovering or focusing the capsule reveals a round minimize or maximize button. Compact mode keeps the Voyager icon and current tab title, preserves open settings, and syncs across supported sites.

## 79

- Date: 2026-08-22
- Version: 0.20.1
- Summary: Removes obsolete manual navigation offsets.
- Notes: Top gap and Right offset are removed from settings because the control capsule can be positioned directly. Maximum markers remains configurable.

## 78

- Date: 2026-08-22
- Version: 0.20.0
- Summary: Enables touchpad marker scrolling and movable navigation controls.
- Notes: Marker queues support two-finger scrolling and press-drag scrolling without accidental activation. The full control capsule can be dragged and its synchronized viewport position is restored across supported sites.

## 77

- Date: 2026-08-18
- Version: 0.19.0
- Summary: Shows a copy-success toast after Chapter View copy actions.
- Notes: Copy current chapter and copy full text display a transient toast only when clipboard write succeeds.

## 76

- Date: 2026-08-18
- Version: 0.18.5
- Summary: Replaces the Chapter View close button with a circular glass close icon.
- Notes: Keeps the close action accessible through an aria label and hover/focus states.

## 75

- Date: 2026-08-18
- Version: 0.18.4
- Summary: Hides the navigation search box when the marker queue is collapsed.
- Notes: The search box now follows the navigation expand/collapse state.

## 74

- Date: 2026-08-18
- Version: 0.18.3
- Summary: Aligns fold-card edge padding with regular text markers.
- Notes: Changes fold-card horizontal padding from 10px to 8px to match marker pills.

## 73

- Date: 2026-08-18
- Version: 0.18.2
- Summary: Adds a count bubble to the left side of each marker fold card.
- Notes: The bubble shows the number of markers stacked in that group while the card label keeps the first title and remaining count.

## 72

- Date: 2026-08-18
- Version: 0.18.1
- Summary: Changes marker folding to full groups of the configured threshold.
- Notes: Only full groups collapse, trailing markers stay visible, cards show the first title plus remaining count, and stack layers use vertical offset with bottom spacing.

## 71

- Date: 2026-08-18
- Version: 0.18.0
- Summary: Folds the first N navigation markers into an expandable stack card.
- Notes: Adds a configurable fold threshold (default 20), in-place expand/collapse with a count, and search bypasses folding.

## 70

- Date: 2026-08-18
- Version: 0.17.0
- Summary: Adds fuzzy title search to the navigation marker queue and Chapter View.
- Notes: Matches titles by Unicode-aware, case-insensitive subsequence after removing whitespace; Command/Control+F focuses the current search box.

## 69

- Date: 2026-08-18
- Version: 0.16.8
- Summary: Adds browser-language internationalization for the extension UI.
- Notes: Uses Chinese for `zh*` browser languages and English otherwise, with English as the missing-key fallback.

## 68

- Date: 2026-08-18
- Version: 0.16.7
- Summary: Speeds up control-tab switching and restores the navigation icon and chevron.
- Notes: Switching settings and navigation tabs updates only tab state; clicking the active navigation tab still re-renders to collapse or expand the marker queue.

## 67

- Date: 2026-08-18
- Version: 0.16.6
- Summary: Adds explicit settings-menu dismissal.
- Notes: Pressing Escape or clicking outside the control capsule and settings panel returns to the navigation tab.

## 66

- Date: 2026-08-18
- Version: 0.16.5
- Summary: Restores the dark glass surface for normal markers in dark mode.
- Notes: Hovered, selected, and floating active markers remain white with black text.

## 65

- Date: 2026-08-18
- Version: 0.16.4
- Summary: Fixes dark-mode marker overrides.
- Notes: Moves the dark-mode marker rules after their base styles so normal, selected, and floating active markers render with white backgrounds.

## 64

- Date: 2026-08-18
- Version: 0.16.3
- Summary: Uses a white marker surface in dark mode.
- Notes: Normal, hovered, selected, and floating active markers use white or near-white backgrounds with black text in dark mode.

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
