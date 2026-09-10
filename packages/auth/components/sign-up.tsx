import { SignUp as ClerkSignUp } from "@clerk/nextjs";

export const SignUp = () => (
  <ClerkSignUp
    appearance={{
      options: {
        elevation: "flush",
      },
      elements: {
        rootBox: {
          width: "100%",
        },
        cardBox: {
          width: "100%",
          boxShadow: "none",
        },
        card: {
          width: "100%",
          padding: 0,
          border: 0,
          background: "transparent",
          boxShadow: "none",
        },
        header: {
          alignItems: "flex-start",
          gap: "0.375rem",
          padding: 0,
          textAlign: "left",
        },
        headerTitle: {
          color: "var(--foreground)",
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
        },
        headerSubtitle: {
          color: "var(--muted-foreground)",
          fontSize: "0.875rem",
          lineHeight: 1.5,
        },
        main: {
          gap: "1.125rem",
        },
        socialButtonsBlockButton: {
          minHeight: "2.75rem",
          border: "1px solid var(--border)",
          borderRadius: "0.625rem",
          background: "var(--control)",
          boxShadow: "none",
          color: "var(--foreground)",
          fontWeight: 600,
        },
        socialButtonsBlockButtonText: {
          fontWeight: 600,
        },
        dividerLine: {
          background: "var(--border)",
        },
        dividerText: {
          color: "var(--muted-foreground)",
          fontSize: "0.75rem",
        },
        form: {
          gap: "1rem",
        },
        formFieldLabel: {
          color: "var(--foreground)",
          fontSize: "0.8125rem",
          fontWeight: 600,
        },
        formFieldInput: {
          minHeight: "2.75rem",
          border: "1px solid transparent",
          borderRadius: "0.625rem",
          background: "var(--control)",
          boxShadow: "none",
          color: "var(--foreground)",
          fontSize: "0.875rem",
        },
        formFieldAction: {
          color: "var(--foreground)",
          fontSize: "0.75rem",
          fontWeight: 600,
        },
        formFieldInputShowPasswordButton: {
          color: "var(--muted-foreground)",
        },
        formButtonPrimary: {
          minHeight: "2.75rem",
          borderRadius: "0.625rem",
          background: "var(--primary)",
          boxShadow: "none",
          color: "var(--primary-foreground)",
          fontSize: "0.875rem",
          fontWeight: 700,
        },
        identityPreview: {
          border: 0,
          borderRadius: "0.625rem",
          background: "var(--control)",
          boxShadow: "none",
        },
        identityPreviewText: {
          color: "var(--foreground)",
        },
        otpCodeFieldInput: {
          borderColor: "var(--border)",
          background: "var(--control)",
          color: "var(--foreground)",
        },
        alert: {
          borderRadius: "0.625rem",
          boxShadow: "none",
        },
        footer: {
          display: "none",
        },
      },
    }}
  />
);
