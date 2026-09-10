import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AuthProviderLoading } from "../../auth-provider-loading";

const title = "Вход";
const description =
  "Влезте в AutoMarket, за да управлявате запазени обяви, съобщения и автомобили.";
const SignIn = dynamic(
  () => import("@repo/auth/components/sign-in").then((mod) => mod.SignIn),
  { loading: () => <AuthProviderLoading title="Зареждане на входа" /> }
);

export const metadata: Metadata = createMetadata({ title, description });

const SignInPage = () => (
  <div className="w-full">
    <h1 className="sr-only">Вход в AutoMarket</h1>
    <SignIn />
    <p className="mt-5 text-center text-muted-foreground text-sm">
      Нямате профил?{" "}
      <Link
        className="rounded-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        href="/sign-up"
      >
        Създайте профил
      </Link>
    </p>
  </div>
);

export default SignInPage;
