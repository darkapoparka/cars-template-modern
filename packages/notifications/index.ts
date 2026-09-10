import "server-only";
import { Knock } from "@knocklabs/node";
import { keys } from "./keys";

let client: Knock | undefined;

export const getNotifications = (): Knock | undefined => {
  const key = keys().KNOCK_SECRET_API_KEY;
  if (!key) {
    return;
  }

  client ??= new Knock({ apiKey: key });
  return client;
};
