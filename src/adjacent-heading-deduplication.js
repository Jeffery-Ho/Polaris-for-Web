export function dedupeAdjacentTextHeadings(headings, scopeForHeading) {
  let previous = null;

  return headings.filter((heading) => {
    const scope = scopeForHeading(heading);
    const isDuplicate = Boolean(
      scope
      && previous
      && previous.scope === scope
      && previous.sourceType === "heading"
      && heading.sourceType === "heading"
      && previous.title === heading.title
    );

    previous = { ...heading, scope };
    return !isDuplicate;
  });
}
