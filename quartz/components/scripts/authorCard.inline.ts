// The portrait remains a normal bio-page link, including on touch screens.
// Escape dismisses the hover/focus card without moving keyboard focus.
document.addEventListener("nav", () => {
  document
    .querySelectorAll<HTMLElement>("[data-author-card]")
    .forEach((root) => {
      const reset = () => delete root.dataset.dismissed;
      const leave = () => {
        if (!root.contains(document.activeElement)) reset();
      };
      const blur = (event: FocusEvent) => {
        if (!root.contains(event.relatedTarget as Node | null)) reset();
      };
      const escape = (event: KeyboardEvent) => {
        if (
          event.key === "Escape" &&
          root.dataset.dismissed !== "true" &&
          (root.matches(":hover") || root.contains(document.activeElement))
        ) {
          event.preventDefault();
          event.stopPropagation();
          root.dataset.dismissed = "true";
        }
      };
      root.addEventListener("pointerenter", reset);
      root.addEventListener("pointerleave", leave);
      root.addEventListener("focusout", blur);
      document.addEventListener("keydown", escape, true);
      window.addCleanup(() => {
        root.removeEventListener("pointerenter", reset);
        root.removeEventListener("pointerleave", leave);
        root.removeEventListener("focusout", blur);
        document.removeEventListener("keydown", escape, true);
      });
    });
});
