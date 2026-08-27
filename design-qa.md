# Support Page Design QA

**Comparison target**

- Source visual truth: `design-evidence/support-reference.png` (1536 × 1024), supplemented by the user's later direction to use the supplied reference's heavy geometric sans-serif heading, make PayPal the prominent CTA, and use `assets/polaris-introduction.mp4` as the real media.
- Rendered implementation: `design-evidence/support-desktop.jpg` (1280 × 989) at a CSS viewport of 1280 × 900; `design-evidence/support-mobile.jpg` (390 × 844) at a CSS viewport of 390 × 844. Both captures use device scale factor 1.
- Combined comparison evidence: `design-evidence/comparison.jpg`, captured from `design-evidence/comparison.html` with the source and rendered desktop page in one browser view.
- State: initial page load after the configured local MP4 had begun muted autoplay.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- The reference's serif heading is intentionally replaced with the requested heavyweight geometric sans-serif. The hierarchy, centered composition, and dense display scale remain consistent with the selected direction.
- The reference's decorative video illustration is intentionally replaced with the supplied 1698 × 1080 MP4. It is displayed inside the requested 16:9 frame using `object-fit: cover`; the slight vertical crop is the expected trade-off for the fixed responsive ratio.
- The dark PayPal control intentionally diverges from the light reference button because the user requested a more prominent CTA. It has strong contrast, visible elevation, hover/focus treatment, and remains visually distinct from the page chrome.

**Required fidelity surfaces**

- Fonts and typography: heavy, tight-tracked geometric sans heading follows the later font reference; support text and links use legible system-sans fallbacks. Mobile heading wraps cleanly to two lines.
- Spacing and layout rhythm: glass header, centered headline, 16:9 media, CTA, and footer retain a clear vertical sequence. Desktop and mobile show no horizontal overflow.
- Colors and visual tokens: pale neutral background and glass surfaces preserve the selected light direction; navy CTA creates the user-requested conversion emphasis.
- Image quality and asset fidelity: existing Polaris icon is reused; Chrome and GitHub use icon-library assets; the supplied MP4 is used as the media instead of a CSS or placeholder approximation.
- Copy and content: verified headline, supporting line, link labels, PayPal destination, and linked `JEFFERY HO` footer label.

**Focused-region comparison**

- Mobile capture: `design-evidence/support-mobile.jpg`. The header links wrap beneath the brand without overflow; media measures 16:9; the PayPal CTA and `JEFFERY HO` link are fully visible and tappable.

**Interaction checks**

- The video loaded with `autoplay`, `muted`, `loop`, and `playsinline`; at verification it was unpaused with `readyState` 4 and a non-zero playback time.
- PayPal opens `https://paypal.me/jefferyhoHK` in a new tab with `rel="noreferrer"`.
- Chrome Web Store, GitHub Issues, and the X profile links have the intended destinations and new-tab behavior.
- Browser console had no warnings or errors.

**Implementation checklist**

1. Keep `assets/polaris-introduction.mp4` and `support-config.js` together when deploying the static site.
2. If first-load weight becomes a concern, replace the MP4 with an optimized file at the same path and re-run this QA check.

## Follow-up verification — 0.38.2(163)

- The header brand and document title now use `Polaris` without the `for Web` suffix, as requested.
- A visible loading prompt is present before MP4 playback; it changes to a buffering prompt when data stalls and does not intercept native video controls if autoplay is rejected.
- Browser verification confirmed `Support Polaris`, a playing muted video with non-zero playback time, and a hidden status prompt after playback begins.

final result: passed
