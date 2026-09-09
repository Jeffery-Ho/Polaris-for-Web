export function pointerCaptureTargetForEvent({ target, capsule }) {
  const interactiveTarget = typeof target?.closest === "function"
    ? target.closest("button, a, [role=\"button\"]")
    : null;
  return interactiveTarget && typeof capsule?.contains === "function" && capsule.contains(interactiveTarget)
    ? interactiveTarget
    : capsule;
}
