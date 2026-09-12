/** Draft preferences are already rendered into the canonical message field. */
export const toFinancingContactFormData = (draft: FormData): FormData => {
  const payload = new FormData();
  for (const [name, value] of draft) {
    if (name !== "term" && name !== "deposit" && name !== "note") {
      // Preserve duplicates and unexpected fields for server-side rejection.
      payload.append(name, value);
    }
  }
  return payload;
};
