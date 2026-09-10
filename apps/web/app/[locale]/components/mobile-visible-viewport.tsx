"use client";

import { useEffect } from "react";

const editableSelector =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';

function revealInScroller(
  parent: HTMLElement,
  field: HTMLElement,
  viewport: VisualViewport
) {
  if (
    !["auto", "scroll"].includes(getComputedStyle(parent).overflowY) ||
    parent.scrollHeight <= parent.clientHeight
  ) {
    return;
  }
  const bounds = parent.getBoundingClientRect();
  const target = field.getBoundingClientRect();
  const top = Math.max(bounds.top, viewport.offsetTop) + 12;
  const bottom =
    Math.min(bounds.bottom, viewport.offsetTop + viewport.height) - 12;
  if (target.bottom > bottom) {
    parent.scrollBy({ top: target.bottom - bottom, behavior: "instant" });
  } else if (target.top < top) {
    parent.scrollBy({ top: target.top - top - 20, behavior: "instant" });
  }
}

/** The phone keyboard can resize the visual viewport without changing dvh. */
export function MobileVisibleViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width: 1023px)");
    let frame = 0;
    let revealFrame = 0;

    const revealFocusedField = () => {
      const field = document.activeElement;
      if (!(field instanceof HTMLElement && field.matches(editableSelector))) {
        return;
      }
      const dialog = field.closest('[role="dialog"]');
      if (!dialog) {
        return;
      }
      let parent = field.parentElement;
      while (parent && dialog.contains(parent)) {
        revealInScroller(parent, field, viewport);
        parent = parent.parentElement;
      }
    };

    const reset = () => {
      delete root.dataset.mobileViewport;
      delete root.dataset.mobileKeyboard;
      for (const name of [
        "--mobile-visible-height",
        "--mobile-visible-top",
        "--mobile-keyboard-inset",
      ]) {
        root.style.removeProperty(name);
      }
    };
    const update = () => {
      if (!mobile.matches) {
        reset();
        return;
      }
      // Do not interpret pinch zoom as a keyboard or interfere with browser zoom.
      if (Math.abs(viewport.scale - 1) > 0.05) {
        return;
      }
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      root.dataset.mobileViewport = "true";
      root.dataset.mobileKeyboard = inset > 100 ? "true" : "false";
      root.style.setProperty("--mobile-visible-height", `${viewport.height}px`);
      root.style.setProperty("--mobile-visible-top", `${viewport.offsetTop}px`);
      root.style.setProperty("--mobile-keyboard-inset", `${inset}px`);
      cancelAnimationFrame(revealFrame);
      revealFrame = requestAnimationFrame(revealFocusedField);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule);
    mobile.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(revealFrame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", schedule);
      mobile.removeEventListener("change", schedule);
      reset();
    };
  }, []);
  return null;
}
