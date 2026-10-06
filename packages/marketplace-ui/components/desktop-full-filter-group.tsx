import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import type { desktopFullFilterGroups } from "../lib/desktop-full-filter-policy";
import {
  type DesktopFullFilterDraftProps,
  DesktopFullFilterSectionFields,
} from "./desktop-full-filter-content";
import styles from "./desktop-full-filter-dialog.module.css";
import { DesktopMakeModelColumns } from "./desktop-make-model-columns";

export function DesktopFullFilterGroupContent({
  group,
  onChooseCategory,
  resetVersion,
  ...fields
}: DesktopFullFilterDraftProps & {
  group: (typeof desktopFullFilterGroups)[number];
  onChooseCategory: () => void;
  resetVersion: number;
}) {
  if (group.id === "vehicle") {
    return (
      <DesktopMakeModelColumns
        {...fields}
        key={`${fields.draft.category}:${resetVersion}`}
        onChooseCategory={onChooseCategory}
      />
    );
  }
  return (
    <ScrollArea className="min-h-0 flex-1" key={`${group.id}:${resetVersion}`}>
      <div className={styles.groupGrid}>
        {group.sections.map((id) => (
          <DesktopFullFilterSectionFields {...fields} key={id} section={id} />
        ))}
      </div>
    </ScrollArea>
  );
}
