# Polaris Interaction Design Guidelines

## Active Maker, Group Collapse, and List Scrolling

These rules apply to the shared Maker navigation UI on every supported platform:

- Selection identifies the active source section; it does not own the visibility of its Maker row.
- A manual collapse of either a Maker stack or a user-question group takes priority over automatic Active Maker expansion. The selected Maker remains active while hidden and regains its active styling when the group is reopened.
- Search continues to expand matching results temporarily without rewriting the user's normal group state.
- Wheel, trackpad, and pointer-drag input take control from temporary Active Maker list positioning without clearing the selected Maker.
- A pointer gesture may begin on a Maker, user group, or fold card. Movement beyond 4 px becomes a list drag and suppresses the card click; a gesture within the threshold remains a click.
- Route changes, configuration reset, and fold-threshold changes clear transient fold state. This state is not persisted to Chrome Storage or Maker snapshots.
