export class Element {
  constructor(tag = "div", attrs = {}, children = [], text = "") {
    this.tagName = tag.toUpperCase();
    this.attrs = attrs;
    this.children = children;
    this.parentElement = null;
    this.text = text;
    children.forEach((child) => { child.parentElement = this; });
  }
  get textContent() { return this.text + this.children.map((child) => child.textContent).join(""); }
  get innerText() { return this.textContent; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  matches(selector) {
    return selector.split(",").some((part) => {
      const tokens = part.trim().split(/\s+/);
      const matchesToken = (node, token) => {
        const has = token.match(/:has\(([^()]*)\)/);
        if (has && !node.querySelector(has[1])) return false;
        token = token.replace(/:has\([^()]*\)/, "");
        const tag = token.match(/^[a-z][a-z0-9]*/i)?.[0];
        if (tag && node.tagName !== tag.toUpperCase()) return false;
        const id = token.match(/#([\w-]+)/)?.[1];
        if (id && node.attrs.id !== id) return false;
        const classes = String(node.attrs.class || "").split(/\s+/);
        if (Array.from(token.matchAll(/\.([\w-]+)/g)).some((match) => !classes.includes(match[1]))) return false;
        return Array.from(token.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g))
          .every((match) => Object.hasOwn(node.attrs, match[1]) && (match[2] === undefined || node.attrs[match[1]] === match[2]));
      };
      let node = this;
      if (!matchesToken(node, tokens.pop())) return false;
      while (tokens.length) {
        const token = tokens.pop();
        node = node.parentElement;
        while (node && !matchesToken(node, token)) node = node.parentElement;
        if (!node) return false;
      }
      return true;
    });
  }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node;
    return null;
  }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  contains(node) { return node === this || this.children.some((child) => child.contains(node)); }
  append(child) { child.parentElement = this; this.children.push(child); }
  remove() {
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }
}
