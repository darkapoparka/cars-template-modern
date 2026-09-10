import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/design-system/components/ui/drawer";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/design-system/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import type { Meta, StoryObj } from "@storybook/react";

const SurfaceSample = ({
  className,
  description,
  name,
}: {
  className: string;
  description: string;
  name: string;
}) => (
  <div className={`min-h-28 rounded-lg border p-4 ${className}`}>
    <p className="font-semibold">{name}</p>
    <p className="mt-1 text-sm opacity-75">{description}</p>
  </div>
);

const DesignFoundationFixture = () => (
  <main className="min-h-screen bg-canvas p-4 text-foreground sm:p-8">
    <div className="mx-auto grid max-w-6xl gap-6">
      <header>
        <p className="font-medium text-info-foreground text-sm">
          Generic visual fixture
        </p>
        <h1 className="mt-1 font-bold text-2xl tracking-tight">
          Surface hierarchy and interaction states
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground text-sm">
          Use Tab and Shift+Tab to inspect focus-visible treatment. Hover the
          controls and open both overlays to review motion, density, and
          elevation.
        </p>
      </header>

      <section aria-labelledby="surfaces-title">
        <h2 className="mb-3 font-semibold" id="surfaces-title">
          Surfaces
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SurfaceSample
            className="bg-canvas"
            description="Off-white application background"
            name="Canvas"
          />
          <SurfaceSample
            className="bg-panel shadow-panel"
            description="White working surface"
            name="Panel"
          />
          <SurfaceSample
            className="bg-control"
            description="Filled utility surface"
            name="Control"
          />
          <SurfaceSample
            className="border-selected bg-selected text-selected-foreground"
            description="Primary and selected state"
            name="Selected"
          />
        </div>
      </section>

      <section
        aria-labelledby="actions-title"
        className="rounded-lg border bg-panel p-4 shadow-panel sm:p-6"
      >
        <h2 className="font-semibold" id="actions-title">
          Actions and status
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button autoFocus>Primary focus</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Confirm</Button>
          <Button variant="destructive">Delete</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Selected</Badge>
          <Badge variant="secondary">Neutral</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Information</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section
        aria-labelledby="forms-title"
        className="rounded-lg border bg-panel p-4 shadow-panel sm:p-6"
      >
        <h2 className="font-semibold" id="forms-title">
          Form states
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="fixture-default"
          >
            Default
            <Input id="fixture-default" placeholder="Enter a value" />
          </label>
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="fixture-disabled"
          >
            Disabled
            <Input disabled id="fixture-disabled" placeholder="Unavailable" />
          </label>
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="fixture-invalid"
          >
            Error
            <Input
              aria-describedby="fixture-error"
              aria-invalid="true"
              defaultValue="Invalid value"
              id="fixture-invalid"
            />
            <span className="text-destructive text-xs" id="fixture-error">
              Correct this field before continuing.
            </span>
          </label>
          <div className="grid content-start gap-1.5 font-medium text-sm">
            <span>Selection</span>
            <Select defaultValue="standard">
              <SelectTrigger aria-label="Choose density" className="w-full">
                <SelectValue placeholder="Choose density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem disabled value="unavailable">
                  Unavailable
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="semantic-title"
        className="grid gap-3 sm:grid-cols-3"
      >
        <h2 className="sr-only" id="semantic-title">
          Semantic surfaces
        </h2>
        <SurfaceSample
          className="border-success/20 bg-success-surface text-success-foreground"
          description="Completed or verified information"
          name="Success"
        />
        <SurfaceSample
          className="border-warning/20 bg-warning-surface text-warning-foreground"
          description="Caution that needs attention"
          name="Warning"
        />
        <SurfaceSample
          className="border-destructive/20 bg-destructive-surface text-destructive"
          description="Error or destructive outcome"
          name="Error"
        />
      </section>

      <section
        aria-labelledby="table-title"
        className="overflow-hidden rounded-lg border bg-panel shadow-panel"
      >
        <div className="p-4">
          <h2 className="font-semibold" id="table-title">
            Compact working table
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Dense by default, with clear hover and selected rows.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium font-mono">REF-1042</TableCell>
              <TableCell>
                <Badge variant="success">Ready</Badge>
              </TableCell>
              <TableCell>Alex Morgan</TableCell>
              <TableCell className="text-right text-muted-foreground">
                8 minutes ago
              </TableCell>
            </TableRow>
            <TableRow data-state="selected">
              <TableCell className="font-medium font-mono">REF-1041</TableCell>
              <TableCell>
                <Badge variant="warning">Review</Badge>
              </TableCell>
              <TableCell>Sam Rivera</TableCell>
              <TableCell className="text-right text-muted-foreground">
                Yesterday
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section
        aria-labelledby="overlays-title"
        className="rounded-lg border bg-panel p-4 shadow-panel sm:p-6"
      >
        <h2 className="font-semibold" id="overlays-title">
          Overlays
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent size="lg">
              <SheetHeader>
                <SheetTitle>Supporting workspace</SheetTitle>
                <SheetDescription>
                  A large sheet for extended controls or focused editing.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 px-4 text-muted-foreground text-sm">
                Main content remains on a white working surface.
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Apply</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-xl">
                <DrawerHeader>
                  <DrawerTitle>Focused mobile task</DrawerTitle>
                  <DrawerDescription>
                    A compact bottom drawer with persistent actions.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Confirm</Button>
                  </DrawerClose>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </section>
    </div>
  </main>
);

const meta = {
  title: "Foundation/Surface and states",
  component: DesignFoundationFixture,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DesignFoundationFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = {
  parameters: {
    themes: {
      themeOverride: "dark",
    },
  },
};
