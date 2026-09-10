import { createElement } from "react";

export const ListingContactHoneypot = () =>
  createElement(
    "div",
    {
      "aria-hidden": true,
      className: "absolute -left-[10000px] h-px w-px overflow-hidden",
    },
    createElement("label", { htmlFor: "listing-contact-website" }, "Website"),
    createElement("input", {
      autoComplete: "off",
      id: "listing-contact-website",
      name: "website",
      tabIndex: -1,
    })
  );
