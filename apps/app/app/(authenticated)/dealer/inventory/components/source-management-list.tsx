import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  CableIcon,
  KeyRoundIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCwIcon,
  UnplugIcon,
  UploadIcon,
} from "lucide-react";
import Link from "next/link";
import {
  createInventorySourceAction,
  transitionInventorySourceAction,
} from "../actions";
import {
  formatImporterTimestamp,
  formatImporterToken,
} from "../importer-view-state";

export interface ManagedInventorySource {
  readonly configVersion: number;
  readonly credentialBindings: readonly {
    readonly purpose: string;
    readonly retiringUntil?: string;
    readonly status: string;
    readonly verifiedAt?: string;
    readonly version: number;
  }[];
  readonly credentialHealthStatus: string;
  readonly id: string;
  readonly kind: string;
  readonly lastSuccessfulSyncAt?: string;
  readonly name: string;
  readonly sourceKey: string;
  readonly status: string;
  readonly syncMode: string;
}

interface SourceManagementListProps {
  readonly canManage: boolean;
  readonly credentialProvider: "configured" | "unconfigured";
  readonly sources: readonly ManagedInventorySource[];
  readonly state?: string;
}

const notices: Readonly<Record<string, string>> = {
  invalid_source: "Изберете тип, режим на синхронизиране и ясно име.",
  source_conflict: "Източникът е променен или този преход не е разрешен.",
  source_create_failed: "Източникът не беше създаден.",
  source_created: "Източникът е създаден в режим на настройка.",
  source_gate_conflict: "Необходим е активен достъп за доставка на инвентар.",
  source_transition_failed: "Състоянието на източника не беше променено.",
  source_updated: "Състоянието на източника е обновено.",
};

const tone = (status: string) => {
  if (status === "active") {
    return "success" as const;
  }
  if (["disabled", "failed", "revoked"].includes(status)) {
    return "destructive" as const;
  }
  if (["degraded", "paused", "retiring"].includes(status)) {
    return "warning" as const;
  }
  return "secondary" as const;
};

type InventorySourceTransition = "activate" | "disconnect" | "pause" | "resume";

const transitionIcons = {
  activate: PlayIcon,
  disconnect: UnplugIcon,
  pause: PauseIcon,
  resume: PlayIcon,
} satisfies Record<InventorySourceTransition, typeof PlayIcon>;

const noticeClassName = (state: string) => {
  const isError =
    state.includes("failed") ||
    state.includes("conflict") ||
    state === "invalid_source";

  return `rounded-lg border p-3 text-sm ${
    isError
      ? "border-destructive/30 bg-destructive-surface text-destructive"
      : "bg-card"
  }`;
};

const credentialBindingLabel = (
  binding: ManagedInventorySource["credentialBindings"][number] | undefined,
  sourceKind: string
) => {
  if (binding) {
    return `${formatImporterToken(binding.purpose)} · v${binding.version}`;
  }
  if (sourceKind === "csv") {
    return "Не е нужно за качване";
  }
  return "Не е осигурено";
};

const SourceNotice = ({ state }: { readonly state?: string }) => {
  if (!state) {
    return null;
  }

  const notice = notices[state];
  if (!notice) {
    return null;
  }

  return <div className={noticeClassName(state)}>{notice}</div>;
};

const SourceTransitionButton = ({
  sourceId,
  transition,
}: {
  readonly sourceId: string;
  readonly transition: InventorySourceTransition;
}) => {
  const labels = {
    activate: "Активирай",
    disconnect: "Прекъсни",
    pause: "Пауза",
    resume: "Възобнови",
  };
  const Icon = transitionIcons[transition];
  return (
    <form action={transitionInventorySourceAction}>
      <input name="inventorySourceId" type="hidden" value={sourceId} />
      <input name="transition" type="hidden" value={transition} />
      <Button
        size="sm"
        type="submit"
        variant={transition === "disconnect" ? "outline" : "secondary"}
      >
        <Icon />
        {labels[transition]}
      </Button>
    </form>
  );
};

const SourceActions = ({
  canManage,
  source,
}: {
  readonly canManage: boolean;
  readonly source: ManagedInventorySource;
}) => {
  if (!canManage) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {source.status === "pending" ? (
        <SourceTransitionButton sourceId={source.id} transition="activate" />
      ) : null}
      {source.status === "active" || source.status === "degraded" ? (
        <SourceTransitionButton sourceId={source.id} transition="pause" />
      ) : null}
      {source.status === "paused" ? (
        <SourceTransitionButton sourceId={source.id} transition="resume" />
      ) : null}
      {source.status !== "disabled" ? (
        <SourceTransitionButton sourceId={source.id} transition="disconnect" />
      ) : null}
      {source.kind === "csv" ? (
        <Button asChild size="sm">
          <Link
            href={`/dealer/inventory/imports/new?source=${encodeURIComponent(source.id)}`}
          >
            <UploadIcon />
            Качи CSV
          </Link>
        </Button>
      ) : null}
    </div>
  );
};

const ManagedSourceCard = ({
  canManage,
  credentialProvider,
  source,
}: {
  readonly canManage: boolean;
  readonly credentialProvider: SourceManagementListProps["credentialProvider"];
  readonly source: ManagedInventorySource;
}) => {
  const currentBinding = source.credentialBindings[0];

  return (
    <article className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-sm">{source.name}</h3>
            <Badge variant={tone(source.status)}>
              {formatImporterToken(source.status)}
            </Badge>
            <Badge variant="outline">{formatImporterToken(source.kind)}</Badge>
          </div>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
            {source.sourceKey}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {formatImporterToken(source.syncMode)} · config v
            {source.configVersion} · last good{" "}
            {formatImporterTimestamp(source.lastSuccessfulSyncAt)}
          </p>
        </div>
        <SourceActions canManage={canManage} source={source} />
      </div>
      <div className="mt-4 grid gap-3 rounded-md bg-control/55 p-3 sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground text-xs">Състояние на достъпа</p>
          <p className="mt-1 font-medium text-sm">
            {formatImporterToken(source.credentialHealthStatus)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Последно обвързване</p>
          <p className="mt-1 font-medium text-sm">
            {credentialBindingLabel(currentBinding, source.kind)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Ротация</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm">
              {currentBinding
                ? formatImporterToken(currentBinding.status)
                : "Недостъпно"}
            </span>
            <Button disabled size="sm" variant="ghost">
              <RotateCwIcon />
              Ротирай
            </Button>
          </div>
          {credentialProvider === "unconfigured" && source.kind !== "csv" ? (
            <p className="mt-1 text-destructive text-xs">
              Няма конфигуриран доставчик с право за запис.
            </p>
          ) : null}
          {currentBinding?.retiringUntil ? (
            <p className="mt-1 text-muted-foreground text-xs">
              Предишната версия се извежда на{" "}
              {formatImporterTimestamp(currentBinding.retiringUntil)}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export const SourceManagementList = ({
  canManage,
  credentialProvider,
  sources,
  state,
}: SourceManagementListProps) => (
  <div className="space-y-4">
    <SourceNotice state={state} />

    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <PlusIcon className="size-4" />
          <h2 className="font-semibold text-sm">Регистриране на източник</h2>
        </div>
        <p className="mt-1 text-muted-foreground text-sm">
          Конфигурацията не съхранява секретни данни. Новите източници остават
          чакащи до изрично активиране.
        </p>
      </div>
      <form
        action={createInventorySourceAction}
        className="grid gap-3 p-4 md:grid-cols-[minmax(12rem,1fr)_10rem_12rem_auto] md:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="sourceName">Име на източника</Label>
          <Input
            disabled={!canManage}
            id="sourceName"
            name="name"
            placeholder="Основен CSV инвентар"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sourceKind">Тип</Label>
          <select
            className="h-9 w-full rounded-md border bg-control px-3 text-sm"
            defaultValue="csv"
            disabled={!canManage}
            id="sourceKind"
            name="kind"
          >
            <option value="csv">CSV</option>
            <option value="api">API</option>
            <option value="webhook">Webhook</option>
            <option value="https_feed">HTTPS поток</option>
            <option value="json">JSON</option>
            <option value="sftp">SFTP</option>
            <option value="dms">DMS</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="syncMode">Съгласуване</Label>
          <select
            className="h-9 w-full rounded-md border bg-control px-3 text-sm"
            defaultValue="full_snapshot"
            disabled={!canManage}
            id="syncMode"
            name="syncMode"
          >
            <option value="full_snapshot">Пълна снимка</option>
            <option value="incremental">Инкрементално</option>
          </select>
        </div>
        <Button disabled={!canManage} type="submit">
          <CableIcon />
          Създай източник
        </Button>
      </form>
    </section>

    <section className="rounded-lg border bg-card">
      <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-sm">
            Настройки и достъп на източника
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Стойностите за достъп никога не се показват; виждат се само
            състоянието и версията на обвързването.
          </p>
        </div>
        <Badge
          variant={
            credentialProvider === "configured" ? "success" : "destructive"
          }
        >
          <KeyRoundIcon />
          Доставчикът е{" "}
          {credentialProvider === "configured"
            ? "конфигуриран"
            : "неконфигуриран"}
        </Badge>
      </div>
      {sources.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Няма регистрирани източници на инвентар.
        </div>
      ) : (
        <div className="divide-y">
          {sources.map((source) => (
            <ManagedSourceCard
              canManage={canManage}
              credentialProvider={credentialProvider}
              key={source.id}
              source={source}
            />
          ))}
        </div>
      )}
    </section>
  </div>
);
