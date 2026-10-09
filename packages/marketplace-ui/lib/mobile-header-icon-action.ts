/** A 40px visible circle inside the shared 44px mobile tap target. */
export const mobileIconActionGeometryClassName =
  "size-11 shrink-0 rounded-full bg-clip-content p-0.5";

export const mobileHeaderIconActionClassName = `${mobileIconActionGeometryClassName} relative isolate grid place-items-center text-current before:pointer-events-none before:absolute before:inset-0.5 before:-z-10 before:rounded-full before:bg-current/10 before:shadow-[inset_0_1px_0_rgb(255_255_255/0.1),inset_0_0_0_1px_rgb(255_255_255/0.04)] before:transition-colors hover:before:bg-current/15 active:before:bg-current/20 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[var(--lead-site-accent-bright)] focus-visible:outline-offset-2`;

export const mobileImageIconActionClassName = `${mobileIconActionGeometryClassName} border-0 bg-white/95 text-zinc-950 shadow-none transition-colors hover:bg-white active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:size-[18px]`;

/** Apply the same inset and glyph sizing without changing desktop galleries. */
export const mobileGalleryIconInsetClassName =
  "max-lg:bg-clip-content max-lg:p-0.5 max-lg:[&_svg]:size-[18px]";
