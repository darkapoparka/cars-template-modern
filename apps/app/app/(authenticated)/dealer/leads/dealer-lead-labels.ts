const leadStatusLabels = {
  closed: "Затворено",
  contacted: "Осъществен контакт",
  lost: "Загубено",
  new: "Ново",
  qualified: "Квалифицирано",
  spam: "Спам",
  viewed: "Прегледано",
  won: "Спечелено",
} as const;

const leadIntentLabels = {
  availability: "Наличност",
  finance: "Финансиране",
  general: "Общо запитване",
  test_drive: "Тестово шофиране",
  trade_in: "Замяна",
} as const;

export const getDealerLeadStatusLabel = (status: string): string =>
  leadStatusLabels[status as keyof typeof leadStatusLabels] ?? status;

export const getDealerLeadIntentLabel = (intent: string): string =>
  leadIntentLabels[intent as keyof typeof leadIntentLabels] ?? intent;
