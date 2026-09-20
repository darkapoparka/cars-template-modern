/** Keep keyboard traversal inside a native modal, including at browser-chrome boundaries. */
export function containDialogTab(
  event: KeyboardEvent,
  dialog: HTMLDialogElement
): void {
  if (event.key !== "Tab" || !dialog.open) {
    return;
  }
  const controls = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]),select:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (element) =>
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== "hidden"
  );
  const first = controls[0],
    last = controls.at(-1);
  if (!(first && last)) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const current = document.activeElement;
  if (
    event.shiftKey &&
    (current === first || current === dialog || !dialog.contains(current))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (current === last || !dialog.contains(current))
  ) {
    event.preventDefault();
    first.focus();
  }
}
