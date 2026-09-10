import { Button } from "@repo/design-system/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../../../components/header";

interface ImporterPageHeaderProps {
  readonly page: string;
}

export const ImporterPageHeader = ({ page }: ImporterPageHeaderProps) => (
  <Header page={page} pages={["AutoMarket", "Дилър"]}>
    <Button asChild className="mr-3 gap-2 rounded-lg sm:mr-4" size="lg">
      <Link href="/dealer/inventory/new">
        <PlusIcon />
        <span className="hidden sm:inline">Нова обява</span>
        <span className="sm:hidden">Нова</span>
      </Link>
    </Button>
  </Header>
);
