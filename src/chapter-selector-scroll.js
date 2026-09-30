export function revealChapterOption(selector, option, gap = 8) {
  if (!selector || !option) return;
  const selectorRect = selector.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();
  if (optionRect.top < selectorRect.top + gap) {
    selector.scrollTop = Math.max(0, selector.scrollTop - (selectorRect.top + gap - optionRect.top));
  } else if (optionRect.bottom > selectorRect.bottom - gap) {
    selector.scrollTop += optionRect.bottom - (selectorRect.bottom - gap);
  }
}
