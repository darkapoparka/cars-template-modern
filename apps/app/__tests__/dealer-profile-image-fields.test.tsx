import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upload: vi.fn() }));
const storageUnavailablePattern = /Публичното хранилище не е конфигурирано/;
const saveDraftPattern = /Запишете черновата, за да използвате изображението/;

vi.mock("@repo/storage/client", () => ({ upload: mocks.upload }));

import { ProfileImageFields } from "../app/(authenticated)/dealer/profile/profile-image-fields";

describe("Dealer Studio profile image fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps HTTPS fields usable while file upload is unconfigured", () => {
    render(
      <ProfileImageFields
        canManage
        defaultLogoUrl="https://example.bg/logo.png"
        defaultProfileImageUrl="https://example.bg/cover.jpg"
        directorySlug="example-auto"
        storageConfigured={false}
      />
    );

    const publicUrls = screen.getAllByLabelText("Публичен URL");
    expect((publicUrls[0] as HTMLInputElement).value).toBe(
      "https://example.bg/logo.png"
    );
    expect((publicUrls[1] as HTMLInputElement).value).toBe(
      "https://example.bg/cover.jpg"
    );
    expect(
      (screen.getByLabelText("Файл за лого") as HTMLInputElement).disabled
    ).toBe(true);
    expect(screen.getByText(storageUnavailablePattern)).toBeTruthy();
  });

  it("writes the uploaded Blob URL into the draft form field", async () => {
    mocks.upload.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/dealer-logo.png",
    });
    render(
      <ProfileImageFields
        canManage
        directorySlug="example-auto"
        storageConfigured
      />
    );
    const file = new File(["logo"], "dealer logo.png", {
      type: "image/png",
    });

    fireEvent.change(screen.getByLabelText("Файл за лого"), {
      target: { files: [file] },
    });
    const logoUploadButton = screen.getAllByRole("button", {
      name: "Качи",
    })[0];
    if (!logoUploadButton) {
      throw new Error("Expected a logo upload button");
    }
    fireEvent.click(logoUploadButton);

    await waitFor(() =>
      expect(mocks.upload).toHaveBeenCalledWith(
        "dealer-profiles/example-auto/logo/dealer-logo.png",
        file,
        expect.objectContaining({
          access: "public",
          handleUploadUrl: "/api/dealer-profile-media/upload",
        })
      )
    );
    expect(
      (screen.getAllByLabelText("Публичен URL")[0] as HTMLInputElement).value
    ).toBe("https://public.blob.vercel-storage.com/dealer-logo.png");
    expect(screen.getByText(saveDraftPattern)).toBeTruthy();
  });
});
