"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import {
  BarChart3Icon,
  BellIcon,
  CarIcon,
  ClipboardCheckIcon,
  ContactRoundIcon,
  CreditCardIcon,
  HeartIcon,
  InboxIcon,
  ListChecksIcon,
  MessageSquareIcon,
  PlusIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  StoreIcon,
  UserCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { Search } from "./search";

export interface WorkspaceCapabilities {
  readonly admin: boolean;
  readonly buyer: boolean;
  readonly dealer: boolean;
  readonly dealerCommerce: boolean;
  readonly seller: boolean;
}

interface GlobalSidebarProperties {
  readonly capabilities: WorkspaceCapabilities;
  readonly children: ReactNode;
}

interface NavItem {
  readonly activePrefix?: string;
  readonly icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  readonly requiresDealerCommerce?: boolean;
  readonly title: string;
  readonly url: string;
}

interface NavSection {
  readonly capability: keyof WorkspaceCapabilities;
  readonly items: readonly NavItem[];
  readonly label: string;
}

const navSections: readonly NavSection[] = [
  {
    capability: "buyer",
    label: "Купуване",
    items: [
      { title: "Начало", url: "/", icon: CarIcon },
      { title: "Запазени обяви", url: "/saved", icon: HeartIcon },
      {
        title: "Запазени търсения",
        url: "/saved/searches",
        icon: BellIcon,
      },
      { title: "Съобщения", url: "/messages", icon: MessageSquareIcon },
    ],
  },
  {
    capability: "seller",
    label: "Продажби",
    items: [
      { title: "Публикувай обява", url: "/sell/new", icon: PlusIcon },
      { title: "Моите обяви", url: "/sell/listings", icon: ListChecksIcon },
    ],
  },
  {
    capability: "dealer",
    label: "Dealer Studio",
    items: [
      { title: "Инвентар", url: "/dealer/inventory", icon: StoreIcon },
      {
        title: "Публичен профил",
        url: "/dealer/profile",
        icon: ContactRoundIcon,
      },
      {
        title: "Настройка и проверка",
        url: "/dealer/settings",
        icon: Settings2Icon,
      },
      { title: "Запитвания", url: "/dealer/leads", icon: InboxIcon },
      { title: "Анализи", url: "/dealer/analytics", icon: BarChart3Icon },
      {
        title: "Промотиране",
        url: "/dealer/promotions",
        icon: SparklesIcon,
        requiresDealerCommerce: true,
      },
      {
        title: "План и плащания",
        url: "/dealer/billing",
        icon: CreditCardIcon,
        requiresDealerCommerce: true,
      },
    ],
  },
  {
    capability: "admin",
    label: "Администрация",
    items: [
      {
        title: "Модерация",
        url: "/admin/moderation",
        icon: ClipboardCheckIcon,
      },
      { title: "Проверки", url: "/admin/trust", icon: ShieldCheckIcon },
      {
        title: "Заявки за профили",
        url: "/admin/profile-claims",
        icon: ClipboardCheckIcon,
      },
    ],
  },
];

const buyerMobileItems: readonly NavItem[] = [
  { title: "Начало", url: "/", icon: CarIcon },
  { title: "Запазени", url: "/saved", icon: HeartIcon },
  { title: "Съобщения", url: "/messages", icon: MessageSquareIcon },
];

const isActivePath = (pathname: string, url: string) =>
  url === "/"
    ? pathname === "/"
    : pathname === url || pathname.startsWith(`${url}/`);

const getMobileNavItems = (
  capabilities: WorkspaceCapabilities
): readonly NavItem[] => {
  const roleItem = capabilities.dealer
    ? {
        title: "Дилър",
        url: "/dealer/inventory",
        activePrefix: "/dealer",
        icon: StoreIcon,
      }
    : {
        title: "Продай",
        url: "/sell/listings",
        activePrefix: "/sell",
        icon: ListChecksIcon,
      };
  const finalItem = capabilities.admin
    ? {
        title: "Админ",
        url: "/admin/moderation",
        activePrefix: "/admin",
        icon: ShieldCheckIcon,
      }
    : { title: "Профил", url: "/account", icon: UserCircleIcon };

  return [...buyerMobileItems, roleItem, finalItem];
};

const AutoMarketMark = () => (
  <svg
    aria-hidden="true"
    className="size-8 shrink-0 text-orange-600"
    viewBox="0 0 40 36"
  >
    <path
      d="M1.5 34 15.2 3.2A3.5 3.5 0 0 1 18.4 1h4.7a3.5 3.5 0 0 1 3.2 2.2L39 34H28.3l-3.2-8H14.5l-3.2 8H1.5Z"
      fill="currentColor"
    />
    <path className="fill-card" d="m19.8 11.2-3.6 9h7.2l-3.6-9Z" />
  </svg>
);

const getActiveNavigationUrl = (pathname: string, items: readonly NavItem[]) =>
  items
    .filter((item) => isActivePath(pathname, item.url))
    .sort((first, second) => second.url.length - first.url.length)[0]?.url;

const isMobileItemActive = (pathname: string, item: NavItem) =>
  item.activePrefix
    ? pathname === item.activePrefix ||
      pathname.startsWith(`${item.activePrefix}/`)
    : isActivePath(pathname, item.url);

const navigationButtonClassName =
  "h-9 rounded-lg px-2.5 text-[13px] data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:hover:bg-foreground/90 data-[active=true]:hover:text-background";

export const GlobalSidebar = ({
  capabilities,
  children,
}: GlobalSidebarProperties) => {
  const pathname = usePathname();
  const visibleSections = navSections
    .filter((section) => capabilities[section.capability])
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.requiresDealerCommerce || capabilities.dealerCommerce
      ),
    }));
  const mobileNavItems = getMobileNavItems(capabilities);
  const activeNavigationUrl = getActiveNavigationUrl(
    pathname,
    visibleSections.flatMap((section) => section.items)
  );

  return (
    <>
      <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarHeader className="px-3 pt-3 pb-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-12 gap-2.5 px-1 hover:bg-transparent active:bg-transparent"
                size="lg"
                tooltip="AutoMarket"
              >
                <Link aria-label="AutoMarket начало" href="/">
                  <AutoMarketMark />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate font-bold text-base tracking-tight">
                      AutoMarket
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      Моето пространство
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <Search />
        <SidebarContent className="gap-0 px-1 pb-2">
          {visibleSections.map((section) => (
            <SidebarGroup className="py-2" key={section.capability}>
              <SidebarGroupLabel className="h-7 px-2.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={navigationButtonClassName}
                        isActive={activeNavigationUrl === item.url}
                        tooltip={item.title}
                      >
                        <Link
                          aria-current={
                            activeNavigationUrl === item.url
                              ? "page"
                              : undefined
                          }
                          href={item.url}
                        >
                          <item.icon strokeWidth={1.8} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-sidebar-border/70 border-t p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className={navigationButtonClassName}
                isActive={isActivePath(pathname, "/account")}
                tooltip="Профил и настройки"
              >
                <Link
                  aria-current={
                    isActivePath(pathname, "/account") ? "page" : undefined
                  }
                  href="/account"
                >
                  <UserCircleIcon strokeWidth={1.8} />
                  <span>Профил и настройки</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </SidebarInset>
      <nav
        aria-label="Навигация в работното пространство"
        className="fixed inset-x-0 bottom-0 z-40 border-border/80 border-t bg-card/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isMobileItemActive(pathname, item);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 font-medium text-[10px] transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-control hover:text-foreground"
                )}
                href={item.url}
                key={item.title}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.7} />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
