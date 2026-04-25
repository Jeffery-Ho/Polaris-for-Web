# GPT Paragraph Navigator Guidelines

## Heading Marker Rule

- Only recognize and render `gpt-paragraph-nav__marker level-1`.
- Do not recognize, count, or render `level-2`, `level-3`, or `level-4` markers.
- `usableHeadings` must contain only heading items whose `level === 1`.
- Future changes to heading extraction must preserve this rule unless the user explicitly asks to change it.
