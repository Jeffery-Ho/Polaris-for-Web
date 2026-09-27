const HASHED_MARKDOWN_PREFIX = "MarkdownRoot-";
const HASHED_HEADING_PREFIX = "Heading-";

export function classTokenStartsWith(className, prefix) {
  return String(className || "")
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => token.startsWith(prefix));
}

export function classPrefixSelectors(prefix) {
  return `[class^="${prefix}"], [class*=" ${prefix}"]`;
}

export const HASHED_MARKDOWN_ROOT_SELECTOR = classPrefixSelectors(HASHED_MARKDOWN_PREFIX);
export const HASHED_HEADING_SELECTOR = classPrefixSelectors(HASHED_HEADING_PREFIX);

function tagNameFor(node) {
  return String(node?.tagName || node?.tag || "").toUpperCase();
}

function attributeFor(node, name) {
  if (node?.attrs && Object.prototype.hasOwnProperty.call(node.attrs, name)) {
    return node.attrs[name];
  }
  if (typeof node?.getAttribute === "function") {
    return node.getAttribute(name);
  }
  return null;
}

function childNodesFor(node) {
  if (Array.isArray(node?.children)) {
    return node.children;
  }
  if (node?.childNodes) {
    return Array.from(node.childNodes);
  }
  return [];
}

function walk(node, visit) {
  if (!node || typeof node !== "object") {
    return;
  }
  visit(node);
  childNodesFor(node).forEach((child) => walk(child, visit));
}

function containsNode(ancestor, node) {
  if (ancestor === node) {
    return false;
  }
  if (typeof ancestor?.contains === "function") {
    return ancestor.contains(node);
  }
  let found = false;
  childNodesFor(ancestor).forEach((child) => {
    if (!found && (child === node || containsNode(child, node))) {
      found = true;
    }
  });
  return found;
}

function textFor(node) {
  if (typeof node?.text === "string" && node.text) {
    return node.text;
  }
  if (typeof node?.textContent === "string" && node.textContent) {
    return node.textContent;
  }
  return childNodesFor(node).map((child) => textFor(child)).join(" ");
}

export function isHashedMarkdownRoot(node) {
  return classTokenStartsWith(node?.className, HASHED_MARKDOWN_PREFIX);
}

export function hashedMarkdownHeadingLevel(node) {
  const tagName = tagNameFor(node);
  if (/^H[1-6]$/.test(tagName)) {
    return Number(tagName.slice(1));
  }
  if (!classTokenStartsWith(node?.className, HASHED_HEADING_PREFIX)) {
    return 0;
  }
  const ariaLevel = Number(attributeFor(node, "aria-level"));
  if (ariaLevel >= 1 && ariaLevel <= 6) {
    return ariaLevel;
  }
  return 2;
}

export function collectHashedMarkdownSections(root) {
  const matchedRoots = [];
  walk(root, (node) => {
    if (isHashedMarkdownRoot(node)) {
      matchedRoots.push(node);
    }
  });
  const messageNodes = matchedRoots.filter((node) => !matchedRoots.some((other) => containsNode(other, node)));
  const sections = [];
  messageNodes.forEach((messageNode) => {
    walk(messageNode, (node) => {
      if (node === messageNode || isHashedMarkdownRoot(node)) {
        return;
      }
      const level = hashedMarkdownHeadingLevel(node);
      if (!level) {
        return;
      }
      if (!/^H[1-6]$/.test(tagNameFor(node)) && !classTokenStartsWith(node.className, HASHED_HEADING_PREFIX)) {
        return;
      }
      const title = textFor(node).replace(/\s+/g, " ").trim();
      if (!title) {
        return;
      }
      sections.push({ level, title });
    });
  });
  return { messageNodes, sections };
}
