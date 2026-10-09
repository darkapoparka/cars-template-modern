import { describe, expect, it, vi } from "vitest";
import type { SearchSuggestionItem } from "./desktop-search-policy";
import {
  handleDesktopSearchKeyDown,
  isSearchComposition,
} from "./search-keyboard";

const item: SearchSuggestionItem = {
  id: "search-bmw",
  kind: "search",
  label: "BMW",
  description: "Search",
  value: "BMW",
};
const createOptions = () => ({
  activeItem: undefined as SearchSuggestionItem | undefined,
  commitSearch: vi.fn(),
  items: [item],
  onClose: vi.fn(),
  open: true,
  openAssistant: vi.fn(),
  query: "BMW",
  setActiveIndex: vi.fn(),
});
const keyEvent = (key: string, isComposing = false, keyCode = 0) => ({
  key,
  nativeEvent: { isComposing, keyCode },
  preventDefault: vi.fn(),
});

describe("search keyboard policy", () => {
  it.each([
    "Enter",
    "Escape",
    "ArrowDown",
    "ArrowUp",
  ])("leaves %s to an active input composition", (key) => {
    const options = createOptions();
    const event = keyEvent(key, true);
    handleDesktopSearchKeyDown(event, options);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(options.commitSearch).not.toHaveBeenCalled();
    expect(options.onClose).not.toHaveBeenCalled();
    expect(options.setActiveIndex).not.toHaveBeenCalled();
  });
  it("recognizes IME confirmation when the browser only reports keyCode 229", () => {
    const event = keyEvent("Enter", false, 229);
    const options = createOptions();
    expect(isSearchComposition(event)).toBe(true);
    handleDesktopSearchKeyDown(event, options);
    expect(options.commitSearch).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
  it("commits a completed query on Enter", () => {
    const options = createOptions();
    const event = keyEvent("Enter");
    handleDesktopSearchKeyDown(event, options);
    expect(options.commitSearch).toHaveBeenCalledWith("BMW", undefined);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
  it("opens the selected visible listing rather than the typed query", () => {
    const options = createOptions();
    options.activeItem = {
      ...item,
      value: "BMW X5",
      href: "/en/listing/bmw-x5",
    };
    handleDesktopSearchKeyDown(keyEvent("Enter"), options);
    expect(options.commitSearch).toHaveBeenCalledWith(
      "BMW X5",
      "/en/listing/bmw-x5"
    );
  });
  it("does not commit a hidden or empty result list", () => {
    const options = { ...createOptions(), items: [], query: "" };
    const event = keyEvent("Enter");
    handleDesktopSearchKeyDown(event, options);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(options.commitSearch).not.toHaveBeenCalled();
    handleDesktopSearchKeyDown(keyEvent("ArrowDown"), options);
    const update = options.setActiveIndex.mock.calls[0]?.[0];
    expect(typeof update === "function" ? update(0) : update).toBe(-1);
  });
  it("closes on Escape after composition ends", () => {
    const options = createOptions();
    handleDesktopSearchKeyDown(keyEvent("Escape"), options);
    expect(options.onClose).toHaveBeenCalledOnce();
  });
  it("wraps visible suggestions in both directions", () => {
    const options = createOptions();
    handleDesktopSearchKeyDown(keyEvent("ArrowDown"), options);
    expect(options.setActiveIndex.mock.calls[0]?.[0](0)).toBe(0);
    handleDesktopSearchKeyDown(keyEvent("ArrowUp"), options);
    expect(options.setActiveIndex.mock.calls[1]?.[0](0)).toBe(0);
  });
});
