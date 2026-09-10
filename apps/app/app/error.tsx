"use client";

// Errors thrown by a child segment's layout are handled by the nearest parent
// segment boundary. Reuse the workspace fallback here so failures in the
// authenticated layout do not replace the entire root document.
export { default } from "./(authenticated)/error";
