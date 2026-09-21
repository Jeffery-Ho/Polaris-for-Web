export function normalizeSearchText(value) {
  return Array.from(String(value ?? "").normalize("NFKC").toLocaleLowerCase())
    .filter((character) => !/\s/u.test(character))
    .join("");
}

export function matchesSearch(query, title) {
  const needle = Array.from(normalizeSearchText(query));
  if (!needle.length) return true;
  const haystack = normalizeSearchText(title);
  let index = 0;
  for (const character of haystack) {
    if (character === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}
