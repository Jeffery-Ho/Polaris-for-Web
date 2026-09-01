# Polaris Interaction Design Guidelines

## Active Maker, Group Collapse, and List Scrolling

These rules apply to the shared Maker navigation UI on every supported platform:

- Selection identifies the active source section; it does not own the visibility of its Maker row.
- Maker stacks and user-question groups start expanded. A manual collapse remains authoritative: the selected Maker stays active while hidden and regains its active styling when the group is reopened.
- Search continues to expand matching results temporarily without rewriting the user's normal group state.
- Wheel, trackpad, and pointer-drag input take control from temporary Active Maker list positioning without clearing the selected Maker.
- A pointer gesture may begin on a Maker, user group, or fold card. Movement beyond 4 px becomes a list drag and suppresses the card click; a gesture within the threshold remains a click.
- Wheel and trackpad input use the browser's native scrolling only when the pointer is over a Maker, user group, or fold card. Transparent space outside those cards must not extend the list's wheel hit area.
- Wheel and list-scroll hot paths must not scan every Maker, read per-item layout, or refresh every liquid-glass filter. Active styling updates only the previous and next active elements, and floating-marker updates reuse the cached active element.
- User Maker groups and Maker stacks enter a conversation scope expanded, including the latest, previous, and newly streamed groups. Only an explicit user action may collapse them; scrolling and Active Maker updates never take state ownership from the user.
- The scrolling Maker list remains below the search control in the stacking order, including its shadow buffer, so markers never visually cover or intercept the search field.
- Refresh and route activation restart page-memory Marker numbering. Maker groups and chronological order reflect only the currently mounted DOM; unmounted history never remains in the list.
- AI Makers, user groups, fold cards, and the floating Active Maker use lightweight blur and saturation without SVG displacement or chromatic aberration. Controls and search may retain the full liquid-glass effect and refresh only when first registered or resized.
- Route changes, configuration reset, and fold-threshold changes clear transient fold state. This state is not persisted to Chrome Storage.

## Settings Panel Refresh and Scrolling

- Host-page mutations that do not change the visible settings model must not rebuild the settings panel.
- When a real settings update requires rebuilding the panel, its body scroll position is restored so Marker filter controls remain reachable in long conversations.
