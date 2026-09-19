import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { createBrandTheme } from "@repo/design-system/lib/brand-theme";
import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";

const DealerThemeFixture = ({
  accent,
  name,
}: {
  accent: string;
  name: string;
}) => {
  useEffect(() => {
    const root = document.documentElement;
    const theme = createBrandTheme(accent);
    const previous = Object.keys(theme).map((key) => [
      key,
      root.style.getPropertyValue(key),
    ]);
    for (const [key, value] of Object.entries(theme)) {
      root.style.setProperty(key, value);
    }
    return () => {
      for (const [key, value] of previous) {
        if (value) {
          root.style.setProperty(key, value);
        } else {
          root.style.removeProperty(key);
        }
      }
    };
  }, [accent]);
  return (
    <main className="min-h-screen bg-canvas p-8 text-foreground">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <p className="text-meta text-muted-foreground">
            Fictional dealer theme fixture — not live business content
          </p>
          <h1 className="mt-2 font-semibold text-page-title">{name}</h1>
        </header>
        <section className="space-y-4 rounded-xl border bg-panel p-6">
          <h2 className="font-semibold text-section-title">
            Reusable control states
          </h2>
          <label className="flex flex-col gap-2" htmlFor="fixture-search">
            Inventory search
            <Input id="fixture-search" placeholder="Make or model" />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-brand text-brand-foreground hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]">
              Primary action
            </Button>
            <Button className="bg-brand text-brand-foreground" disabled>
              Unavailable action
            </Button>
            <Button variant="outline">Secondary action</Button>
          </div>
          <p className="text-brand-text">
            Brand text remains readable on a light surface.
          </p>
          <p className="text-destructive">
            Validation messages use status colors, not the dealer brand.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Verify portal inheritance</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{name} dialog</DialogTitle>
              <DialogDescription>
                Portalled content inherits the same validated root theme.
              </DialogDescription>
              <Button className="bg-brand text-brand-foreground hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]">
                Themed portal control
              </Button>
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </main>
  );
};
const meta = {
  component: DealerThemeFixture,
  title: "Modern/Dealer theming",
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DealerThemeFixture>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Atlas: Story = {
  args: { accent: "#164e63", name: "Atlas Demo Motors" },
};
export const North: Story = {
  args: { accent: "#facc15", name: "North Demo Vehicle Company" },
};
