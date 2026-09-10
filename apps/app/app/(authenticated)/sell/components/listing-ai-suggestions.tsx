import {
  type ListingCopyStructuredOutput,
  listingCopyStructuredOutputSchema,
} from "@repo/ai";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { applyListingFactorySuggestionsAction } from "../factory-actions";

interface ListingGenerationView {
  readonly errorMessage: string | null;
  readonly generatedDescriptionBg: string | null;
  readonly generatedDescriptionEn: string | null;
  readonly generatedTitle: string | null;
  readonly id: string;
  readonly metadata: unknown;
  readonly model: string | null;
  readonly promptVersion: string;
  readonly provider: string;
}

interface ListingAiSuggestionsProps {
  readonly generation: ListingGenerationView;
  readonly listingId: string;
}

const provenanceLabels = {
  deterministic_fallback: "Детерминирана основа",
  model_inference: "Моделно предложение",
  photo: "Снимка",
  seller_input: "Въведени данни",
  seller_notes: "Бележки",
  vin: "VIN",
} as const;

const getSuggestions = (
  metadata: unknown
): ListingCopyStructuredOutput | null => {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("suggestions" in metadata)
  ) {
    return null;
  }
  const parsed = listingCopyStructuredOutputSchema.safeParse(
    metadata.suggestions
  );
  return parsed.success ? parsed.data : null;
};

const getMode = (metadata: unknown) => {
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "mode" in metadata &&
    typeof metadata.mode === "string"
  ) {
    return metadata.mode;
  }
  return "deterministic-fallback";
};

const Confidence = ({
  suggestion,
}: {
  suggestion: ListingCopyStructuredOutput["title"];
}) => (
  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
    <Badge variant="secondary">
      Увереност {Math.round(suggestion.confidence * 100)}%
    </Badge>
    {suggestion.provenance.map((source) => (
      <Badge key={source} variant="outline">
        {provenanceLabels[source]}
      </Badge>
    ))}
  </div>
);

export const ListingAiSuggestions = ({
  generation,
  listingId,
}: ListingAiSuggestionsProps) => {
  const suggestions = getSuggestions(generation.metadata);
  const mode = getMode(generation.metadata);
  const title = suggestions?.title.value ?? generation.generatedTitle;
  const descriptionBg =
    suggestions?.descriptionBg.value ?? generation.generatedDescriptionBg;
  const descriptionEn =
    suggestions?.descriptionEn.value ?? generation.generatedDescriptionEn;

  if (!(title && descriptionBg && descriptionEn)) {
    return null;
  }

  return (
    <section
      aria-labelledby="ai-suggestions-heading"
      className="rounded-lg border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="flex items-center gap-2 font-semibold"
            id="ai-suggestions-heading"
          >
            <SparklesIcon aria-hidden="true" className="size-4" />
            Предложения за потвърждение
          </h2>
          <p className="mt-1 max-w-3xl text-muted-foreground text-sm">
            Нищо не е приложено автоматично. Сравнете с автомобила и изберете
            само полетата, които потвърждавате.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={mode === "provider" ? "default" : "secondary"}>
            {mode === "provider" ? "AI доставчик" : "Сигурен локален режим"}
          </Badge>
          <Badge variant="outline">{generation.promptVersion}</Badge>
        </div>
      </div>

      {generation.errorMessage ? (
        <p className="mt-3 rounded-lg bg-secondary p-3 text-sm">
          Външният AI не беше използван ({generation.errorMessage}).
          Детерминираното предложение остава достъпно за редакция.
        </p>
      ) : null}

      <form
        action={applyListingFactorySuggestionsAction}
        className="mt-4 grid gap-3"
      >
        <input name="generationId" type="hidden" value={generation.id} />
        <input name="listingId" type="hidden" value={listingId} />

        <label className="grid gap-2 rounded-lg border bg-background p-3">
          <span className="flex items-center gap-2 font-medium text-sm">
            <input name="applyTitle" type="checkbox" />
            Потвърждавам предложеното заглавие
          </span>
          <span className="text-sm">{title}</span>
          {suggestions ? <Confidence suggestion={suggestions.title} /> : null}
        </label>

        <label className="grid gap-2 rounded-lg border bg-background p-3">
          <span className="flex items-center gap-2 font-medium text-sm">
            <input name="applyDescription" type="checkbox" />
            Потвърждавам предложеното описание
          </span>
          <span className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <input
                defaultChecked
                name="descriptionLocale"
                type="radio"
                value="bg"
              />
              Български
            </span>
            <span className="flex items-center gap-2">
              <input name="descriptionLocale" type="radio" value="en" />
              English
            </span>
          </span>
          <span className="rounded-md bg-secondary p-3 text-sm">
            {descriptionBg}
          </span>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              English вариант
            </summary>
            <p className="mt-2 rounded-md bg-secondary p-3">{descriptionEn}</p>
          </details>
          {suggestions ? (
            <Confidence suggestion={suggestions.descriptionBg} />
          ) : null}
        </label>

        {suggestions?.specSuggestions.length ? (
          <div className="rounded-lg border border-dashed p-3">
            <h3 className="font-medium text-sm">
              Спецификации за ръчно потвърждение
            </h3>
            <p className="mt-1 text-muted-foreground text-xs">
              Тези стойности не се прилагат автоматично. Проверете ги и
              редактирайте съответните полета по-долу.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {suggestions.specSuggestions.map((suggestion) => (
                <li
                  className="rounded-md bg-secondary p-2 text-sm"
                  key={`${suggestion.field}:${suggestion.value}`}
                >
                  <span className="font-medium">{suggestion.field}</span>:{" "}
                  {suggestion.value} · {Math.round(suggestion.confidence * 100)}
                  %
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button className="w-fit" type="submit">
          Приложи избраните потвърдени полета
        </Button>
      </form>
    </section>
  );
};
