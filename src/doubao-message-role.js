const DOUBAO_USER_BUBBLE_CLASS = "bg-g-send-msg-bubble-bg";
const DOUBAO_LEGACY_USER_CLASS_PARTS = ["send-message-box", "send-message-content-block"];

export function doubaoMessageRoleFromClassNames(classNames) {
  const names = Array.from(classNames || []);
  return names.includes(DOUBAO_USER_BUBBLE_CLASS)
    || names.some((name) => DOUBAO_LEGACY_USER_CLASS_PARTS.some((part) => name.includes(part)))
    ? "user"
    : "";
}
