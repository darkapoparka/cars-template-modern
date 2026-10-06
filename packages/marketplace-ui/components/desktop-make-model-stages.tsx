"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import type { CSSProperties, ReactNode } from "react";
import styles from "./marketplace-model-picker.module.css";

export type MakeModelStep = "make" | "model" | "derivative";

export function DesktopMakeModelStages({
  derivative,
  hasDerivatives,
  locale,
  make,
  model,
  onStepChange,
  pickerBody,
  searchField,
  step,
}: {
  derivative?: string;
  hasDerivatives: boolean;
  locale?: string;
  make?: string;
  model?: string;
  onStepChange: (step: MakeModelStep) => void;
  pickerBody: ReactNode;
  searchField: ReactNode;
  step: MakeModelStep;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const stages = [
    {
      id: "make",
      label: isBg ? "Марка" : "Make",
      value: make,
      disabled: false,
    },
    {
      id: "model",
      label: isBg ? "Модел" : "Model",
      value: model,
      disabled: !make,
    },
    ...(hasDerivatives
      ? [
          {
            id: "derivative",
            label: isBg ? "Каросерия" : "Body style",
            value: derivative,
            disabled: false,
          },
        ]
      : []),
  ];
  return (
    <Tabs
      className={styles.steps}
      onValueChange={(value) => onStepChange(value as MakeModelStep)}
      value={step}
    >
      <TabsList
        aria-label={isBg ? "Избор на автомобил" : "Vehicle selection"}
        className={styles.stageRail}
        style={
          {
            "--model-step-count": stages.length,
            "--model-active-index": stages.findIndex(
              (stage) => stage.id === step
            ),
          } as CSSProperties
        }
      >
        <span aria-hidden="true" className={styles.indicator} />
        {stages.map((stage) => (
          <TabsTrigger
            disabled={stage.disabled}
            key={stage.id}
            value={stage.id}
          >
            <span>{stage.label}</span>
            <span className={styles.selection}>
              {stage.value ?? (isBg ? "Всички" : "Any")}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {searchField}
      {stages.map((stage) => (
        <TabsContent
          className={styles.stageContent}
          key={stage.id}
          value={stage.id}
        >
          {step === stage.id ? pickerBody : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
