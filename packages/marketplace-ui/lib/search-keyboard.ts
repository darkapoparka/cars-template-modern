import type { Dispatch, SetStateAction } from "react";
import type { SearchSuggestionItem } from "./desktop-search-policy";

interface SearchKeyboardEvent {
  key: string;
  nativeEvent: { isComposing: boolean; keyCode: number };
  preventDefault: () => void;
}

// Some IME/browser combinations report the confirmation Enter as keyCode 229.
export const isSearchComposition = (
  event: Pick<SearchKeyboardEvent, "nativeEvent">
) => event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;

interface DesktopSearchKeyboardOptions {
  activeItem?: SearchSuggestionItem;
  commitSearch: (query: string, href?: string) => void;
  items: readonly SearchSuggestionItem[];
  onClose: () => void;
  open: boolean;
  openAssistant: () => void;
  query: string;
  setActiveIndex: Dispatch<SetStateAction<number>>;
}

export const handleDesktopSearchKeyDown = (
  event: SearchKeyboardEvent,
  options: DesktopSearchKeyboardOptions
) => {
  if (isSearchComposition(event)) {
    return;
  }
  switch (event.key) {
    case "ArrowDown": {
      event.preventDefault();
      if (!options.open) {
        options.openAssistant();
        options.setActiveIndex(0);
        return;
      }
      options.setActiveIndex((currentIndex) =>
        options.items.length ? (currentIndex + 1) % options.items.length : -1
      );
      return;
    }
    case "ArrowUp": {
      event.preventDefault();
      options.setActiveIndex((currentIndex) =>
        options.items.length
          ? (currentIndex <= 0 ? options.items.length : currentIndex) - 1
          : -1
      );
      return;
    }
    case "Escape": {
      if (options.open) {
        event.preventDefault();
        options.onClose();
      }
      return;
    }
    case "Enter": {
      if (options.activeItem || options.query) {
        event.preventDefault();
        options.commitSearch(
          options.activeItem?.value ?? options.query,
          options.activeItem?.href
        );
      }
      return;
    }
    default:
      return;
  }
};
