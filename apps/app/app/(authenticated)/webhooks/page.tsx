export const metadata = {
  title: "Интеграции",
  description: "Интеграции на пазара.",
};

const WebhooksPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
    <section className="w-full max-w-md rounded-xl border border-border bg-card p-4">
      <h1 className="font-semibold text-lg">Интеграции</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Управлението на webhook връзки е изключено, докато AutoMarket няма
        реални дилърски или партньорски интеграции за свързване.
      </p>
    </section>
  </main>
);

export default WebhooksPage;
