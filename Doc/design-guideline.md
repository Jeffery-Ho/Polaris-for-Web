# Polaris Interaction Design Guidelines

## Active Maker, Group Collapse, and List Scrolling

These rules apply to the shared Maker navigation UI on every supported platform:

- Selection identifies the active source section; it does not own the visibility of its Maker row.
- A manual collapse of either a Maker stack or a user-question group takes priority over automatic Active Maker expansion. The selected Maker remains active while hidden and regains its active styling when the group is reopened.
- Search continues to expand matching results temporarily without rewriting the user's normal group state.
- Wheel, trackpad, and pointer-drag input take control from temporary Active Maker list positioning without clearing the selected Maker.
- A pointer gesture may begin on a Maker, user group, or fold card. Movement beyond 4 px becomes a list drag and suppresses the card click; a gesture within the threshold remains a click.
- Wheel and trackpad input use the browser's native scrolling only when the pointer is over a Maker, user group, or fold card. Transparent space outside those cards must not extend the list's wheel hit area.
- Wheel and list-scroll hot paths must not scan every Maker, read per-item layout, or refresh every liquid-glass filter. Active styling updates only the previous and next active elements, and floating-marker updates reuse the cached active element.
- User Maker groups always enter a conversation scope collapsed, including the latest, previous, and newly streamed groups. Only explicit user expansion or search may reveal their children; an active Maker never takes expansion ownership from the user.
- Refresh and route activation restart page-memory Marker numbering while persistent Maker keys and cached chronological order remain authoritative. Partial DOM observations must not promote locally numbered tail records ahead of unmounted history.
- The history-load card is a separate action from the earlier-question disclosure. Loading history may move the host conversation only after explicit user input, must show progress and cancellation, and must restore the prior reading anchor when the run ends.
- During history loading, the conversation and Maker navigation are temporarily locked while the cancel action stays available. The lock belongs only to the active conversation scroller and must be released on completion, timeout, cancellation, route change, or extension invalidation; never restore a permanent global wheel listener.
- AI Makers, user groups, fold cards, and the floating Active Maker use lightweight blur and saturation without SVG displacement or chromatic aberration. Controls and search may retain the full liquid-glass effect and refresh only when first registered or resized.
- Route changes, configuration reset, and fold-threshold changes clear transient fold state. This state is not persisted to Chrome Storage or Maker snapshots.
