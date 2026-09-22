export function bindSearchInput(input, { onInput, onCommit }) {
  let isComposing = false;
  let pendingCompositionCommit = false;

  const updateValue = () => onInput(input.value);

  input.addEventListener("compositionstart", () => {
    isComposing = true;
    pendingCompositionCommit = false;
  });

  input.addEventListener("compositionend", () => {
    isComposing = false;
    pendingCompositionCommit = true;
    updateValue();
    queueMicrotask(() => {
      if (!pendingCompositionCommit) return;
      pendingCompositionCommit = false;
      onCommit();
    });
  });

  input.addEventListener("input", (event) => {
    updateValue();
    if (isComposing || event.isComposing) return;
    if (pendingCompositionCommit) {
      pendingCompositionCommit = false;
      onCommit();
      return;
    }
    onCommit();
  });
}
