import "server-only";
import Stripe from "stripe";
import { keys } from "./keys";

let client: Stripe | undefined;

export const getStripe = (): Stripe | undefined => {
  const { STRIPE_SECRET_KEY } = keys();
  if (!STRIPE_SECRET_KEY) {
    return;
  }

  client ??= new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
  return client;
};

export type { Stripe } from "stripe";
