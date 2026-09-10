import { SidebarTrigger } from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";

interface HeaderProps {
  children?: ReactNode;
  page: string;
  pages: string[];
}

const bulgarianLabels: Readonly<Record<string, string>> = {
  Account: "Профил",
  Admin: "Администрация",
  Analytics: "Анализи",
  Billing: "План и плащания",
  Buyer: "Купуване",
  Checkout: "Плащане",
  "Create listing": "Публикуване на обява",
  Dealer: "Dealer Studio",
  "Edit listing": "Редакция на обява",
  "Import review": "Преглед на импорт",
  "Import runs": "Импорти",
  Inventory: "Инвентар",
  Leads: "Запитвания",
  "Listing Factory": "Създаване на обява",
  Messages: "Съобщения",
  Moderation: "Модерация",
  "My listings": "Моите обяви",
  Overview: "Начало",
  Promotions: "Промотиране",
  "Public profile": "Публичен профил",
  "Profile preview": "Преглед на профила",
  "Profile claims": "Заявки за профили",
  "Profile claim review": "Преглед на заявка",
  "Report listing": "Сигнал за обява",
  "Saved listings": "Запазени обяви",
  "Saved searches": "Запазени търсения",
  Search: "Търсене",
  Seller: "Продажби",
  "Setup & verification": "Настройка и проверка",
  Sources: "Източници",
  "Source-managed listing": "Обява от източник",
  Trust: "Проверки",
  "Trust queue": "Проверки",
  "Upload CSV": "Качване на CSV",
  "Verification review": "Преглед на проверка",
};

const localizeLabel = (label: string) => bulgarianLabels[label] ?? label;

export const Header = ({ pages, page, children }: HeaderProps) => {
  const workspaceContext = pages
    .filter((label) => label !== "AutoMarket")
    .at(-1);

  return (
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-between gap-2 border-border/80 border-b bg-card/95 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2.5 px-3 sm:px-4">
        <SidebarTrigger
          aria-label="Отвори навигацията"
          className="-ml-1 size-9 rounded-lg bg-control text-foreground hover:bg-control-hover"
        />
        <div className="min-w-0 leading-tight">
          {workspaceContext ? (
            <p className="hidden truncate font-medium text-[11px] text-muted-foreground sm:block">
              {localizeLabel(workspaceContext)}
            </p>
          ) : null}
          <p className="truncate font-semibold text-foreground text-sm sm:text-[15px]">
            {localizeLabel(page)}
          </p>
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
};
