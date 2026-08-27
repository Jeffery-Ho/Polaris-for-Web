function captureScrollAnchor(list) {
  const listRect = list.getBoundingClientRect();
  const row = Array.from(list.children).find((candidate) => (
    candidate.getBoundingClientRect().bottom > listRect.top
  )) || null;
  return {
    row,
    offset: row ? row.getBoundingClientRect().top - listRect.top : 0,
    scrollTop: list.scrollTop
  };
}

function restoreScrollAnchor(list, anchor) {
  if (anchor.row && (anchor.row.parentElement === list || anchor.row.parentNode === list)) {
    const listTop = list.getBoundingClientRect().top;
    const nextOffset = anchor.row.getBoundingClientRect().top - listTop;
    list.scrollTop += nextOffset - anchor.offset;
    return;
  }

  const maxScrollTop = Math.max(0, list.scrollHeight - list.clientHeight);
  list.scrollTop = Math.min(maxScrollTop, Math.max(0, anchor.scrollTop));
}

export function createMarkerListReconciler({ createRow, updateRow }) {
  const entries = new Map();

  function reconcile(list, items) {
    const anchor = captureScrollAnchor(list);
    const nextKeys = new Set(items.map((item) => item.key));
    let changed = false;

    entries.forEach((entry, key) => {
      if (nextKeys.has(key)) {
        return;
      }
      if (entry.row.parentElement === list || entry.row.parentNode === list) {
        list.removeChild(entry.row);
      }
      entries.delete(key);
      changed = true;
    });

    items.forEach((item, index) => {
      let entry = entries.get(item.key);
      if (!entry) {
        entry = {
          row: createRow(item),
          signature: item.signature
        };
        entries.set(item.key, entry);
        changed = true;
      } else if (entry.signature !== item.signature) {
        updateRow(entry.row, item);
        entry.signature = item.signature;
        changed = true;
      }

      const rowAtIndex = list.children[index] || null;
      if (rowAtIndex !== entry.row) {
        list.insertBefore(entry.row, rowAtIndex);
        changed = true;
      }
    });

    if (changed) {
      restoreScrollAnchor(list, anchor);
    }
    return {
      changed,
      scrollDelta: list.scrollTop - anchor.scrollTop
    };
  }

  function reset() {
    entries.forEach(({ row }) => {
      const parent = row.parentElement || row.parentNode;
      if (parent) {
        parent.removeChild(row);
      }
    });
    entries.clear();
  }

  return { reconcile, reset };
}
