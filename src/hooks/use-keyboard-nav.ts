"use client";

import { useEffect, useCallback } from "react";

interface KeyboardNavConfig {
  onNext?: () => void;
  onPrev?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onMarkRead?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  enabled?: boolean;
}

export function useKeyboardNav(config: KeyboardNavConfig) {
  const {
    onNext,
    onPrev,
    onOpen,
    onSave,
    onMarkRead,
    onSearch,
    onRefresh,
    enabled = true,
  } = config;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Vim-style navigation
      switch (e.key.toLowerCase()) {
        case "j":
          e.preventDefault();
          onNext?.();
          break;
        case "k":
          e.preventDefault();
          onPrev?.();
          break;
        case "o":
          e.preventDefault();
          onOpen?.();
          break;
        case "s":
          e.preventDefault();
          onSave?.();
          break;
        case "m":
          e.preventDefault();
          onMarkRead?.();
          break;
        case "/":
          e.preventDefault();
          onSearch?.();
          break;
        case "r":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onRefresh?.();
          }
          break;
      }
    },
    [enabled, onNext, onPrev, onOpen, onSave, onMarkRead, onSearch, onRefresh]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
