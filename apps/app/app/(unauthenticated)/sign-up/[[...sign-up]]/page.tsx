import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AuthProviderLoading } from "../../auth-provider-loading";

const title = "Създаване на профил";
const description =
  "Създайте профил в AutoMarket, за да запазвате обяви, продавате автомобили и работите с клиенти.";
const SignUp = dynamic(
  () => import("@repo/auth/components/sign-up").then((mod) => mod.SignUp),
  { loading: () => <AuthProviderLoading title="Зареждане на регистрацията" /> }
);

export const metadata: Metadata = createMetadata({ title, description });

const SignUpPage = () => (
  <div className="w-full">
    <h1 className="sr-only">Създаване на профил в AutoMarket</h1>
    <SignUp />
    <p className="mt-5 text-center text-muted-foreground text-sm">
      Вече имате профил?{" "}
      <Link
        className="rounded-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        href="/sign-in"
      >
        Влезте
      </Link>
    </p>
  </div>
);

export default SignUpPage;
