"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Theme } from "@clerk/types";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

type AuthProviderProperties = ComponentProps<typeof ClerkProvider> & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
};

const variables: Theme["variables"] = {
  borderRadius: "0.625rem",
  colorBackground: "var(--card)",
  colorBorder: "var(--border)",
  colorForeground: "var(--foreground)",
  colorInput: "var(--control)",
  colorInputForeground: "var(--foreground)",
  colorMuted: "var(--control)",
  colorMutedForeground: "var(--muted-foreground)",
  colorPrimary: "var(--primary)",
  colorPrimaryForeground: "var(--primary-foreground)",
  colorRing: "var(--ring)",
  fontFamily: "var(--font-sans)",
  fontFamilyButtons: "var(--font-sans)",
  fontWeight: {
    bold: "var(--font-weight-bold)",
    medium: "var(--font-weight-medium)",
    normal: "var(--font-weight-normal)",
    semibold: 600,
  },
  spacing: "1rem",
};

const elements: Theme["elements"] = {
  dividerLine: {
    background: "var(--border)",
  },
  navbarButton: {
    color: "var(--foreground)",
  },
  organizationPreviewAvatarContainer: {
    flexShrink: 0,
  },
  organizationPreview__organizationSwitcherTrigger: {
    gap: "0.5rem",
  },
  organizationPreviewMainIdentifier: {
    color: "var(--foreground)",
  },
  organizationSwitcherTriggerIcon: {
    color: "var(--muted-foreground)",
  },
  organizationSwitcherTrigger__open: {
    background: "var(--background)",
  },
  socialButtonsIconButton: {
    background: "var(--control)",
  },
};

const bulgarianLocalization = {
  locale: "bg-BG",
  backButton: "Назад",
  dividerText: "или",
  footerActionLink__useAnotherMethod: "Използвайте друг начин",
  footerPageLink__help: "Помощ",
  footerPageLink__privacy: "Поверителност",
  footerPageLink__terms: "Условия",
  formButtonPrimary: "Продължи",
  formButtonPrimary__verify: "Потвърдете",
  formFieldAction__forgotPassword: "Забравена парола?",
  formFieldInputPlaceholder__emailAddress: "name@example.com",
  formFieldInputPlaceholder__emailAddress_username:
    "Имейл или потребителско име",
  formFieldInputPlaceholder__firstName: "Име",
  formFieldInputPlaceholder__lastName: "Фамилия",
  formFieldInputPlaceholder__password: "Въведете парола",
  formFieldInputPlaceholder__signUpPassword: "Създайте парола",
  formFieldLabel__emailAddress: "Имейл адрес",
  formFieldLabel__emailAddress_username: "Имейл или потребителско име",
  formFieldLabel__firstName: "Име",
  formFieldLabel__lastName: "Фамилия",
  formFieldLabel__password: "Парола",
  socialButtonsBlockButton: "Продължи с {{provider|titleize}}",
  socialButtonsBlockButtonManyInView: "{{provider|titleize}}",
  signIn: {
    emailCode: {
      formTitle: "Код за потвърждение",
      resendButton: "Изпратете кода отново",
      subtitle: "Въведете кода, изпратен на вашия имейл.",
      title: "Проверете имейла си",
    },
    forgotPassword: {
      formTitle: "Код за възстановяване",
      resendButton: "Изпратете кода отново",
      subtitle: "Ще ви изпратим код за сигурно възстановяване.",
      subtitle_email: "Ще изпратим код на вашия имейл адрес.",
      subtitle_phone: "Ще изпратим код на вашия телефон.",
      title: "Възстановяване на парола",
    },
    password: {
      actionLink: "Използвайте друг начин",
      subtitle: "Въведете паролата за вашия профил.",
      title: "Въведете парола",
    },
    phoneCode: {
      formTitle: "Код за потвърждение",
      resendButton: "Изпратете кода отново",
      subtitle: "Въведете кода, изпратен на вашия телефон.",
      title: "Проверете телефона си",
    },
    resetPassword: {
      formButtonPrimary: "Запазете новата парола",
      requiredMessage: "Въведете нова парола.",
      successMessage: "Паролата е променена успешно.",
      title: "Нова парола",
    },
    start: {
      actionLink: "Създайте профил",
      actionLink__use_email: "Използвайте имейл",
      actionLink__use_email_username: "Използвайте имейл или потребителско име",
      actionLink__use_passkey: "Използвайте ключ за достъп",
      actionLink__use_phone: "Използвайте телефон",
      actionLink__use_username: "Използвайте потребителско име",
      actionText: "Нямате профил?",
      subtitle:
        "Продължете към запазени обяви, съобщения и вашето работно пространство.",
      subtitleCombined: "Продължете към вашето работно пространство.",
      title: "Влезте в AutoMarket",
      titleCombined: "Влезте в AutoMarket",
    },
  },
  signUp: {
    continue: {
      actionLink: "Влезте",
      actionText: "Вече имате профил?",
      subtitle: "Попълнете оставащите данни, за да завършите регистрацията.",
      title: "Завършете профила си",
    },
    emailCode: {
      formSubtitle: "Въведете изпратения код.",
      formTitle: "Код за потвърждение",
      resendButton: "Изпратете кода отново",
      subtitle: "Изпратихме код на вашия имейл.",
      title: "Проверете имейла си",
    },
    phoneCode: {
      formSubtitle: "Въведете изпратения код.",
      formTitle: "Код за потвърждение",
      resendButton: "Изпратете кода отново",
      subtitle: "Изпратихме код на вашия телефон.",
      title: "Проверете телефона си",
    },
    start: {
      actionLink: "Влезте",
      actionLink__use_email: "Използвайте имейл",
      actionLink__use_phone: "Използвайте телефон",
      actionText: "Вече имате профил?",
      subtitle:
        "Запазвайте обяви, публикувайте автомобили и работете с клиенти на едно място.",
      subtitleCombined: "Създайте своя AutoMarket профил.",
      title: "Създайте профил",
      titleCombined: "Създайте профил в AutoMarket",
    },
  },
};

export const AuthProvider = ({
  privacyUrl,
  termsUrl,
  helpUrl,
  ...properties
}: AuthProviderProperties) => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? dark : undefined;

  const layout: Theme["layout"] = {
    helpPageUrl: helpUrl,
    privacyPageUrl: privacyUrl,
    termsPageUrl: termsUrl,
  };

  return (
    <ClerkProvider
      {...properties}
      appearance={{ elements, layout, theme, variables }}
      localization={bulgarianLocalization}
    />
  );
};
