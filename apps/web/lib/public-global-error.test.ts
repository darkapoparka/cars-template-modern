import { describe, expect, it } from "vitest";
import { getPublicGlobalErrorCopy } from "./public-global-error";

describe("public global error localization", () => {
  it("keeps English routes consistently English", () => {
    expect(getPublicGlobalErrorCopy("/cars")).toMatchObject({
      home: "Go home",
      homeHref: "/",
      lang: "en",
      retry: "Try again",
      title: "Something went wrong",
    });
  });

  it("keeps Bulgarian routes consistently Bulgarian", () => {
    expect(getPublicGlobalErrorCopy("/bg/listing/example")).toMatchObject({
      home: "Към началото",
      homeHref: "/bg",
      lang: "bg",
      retry: "Опитайте отново",
      title: "Нещо се обърка",
    });
  });
});
