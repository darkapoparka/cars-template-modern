import { flag } from "flags/next";

export type BooleanFlagDecision = () =>
  | boolean
  | undefined
  | Promise<boolean | undefined>;

export const createFlag = (
  key: string,
  decide: BooleanFlagDecision = () => false
) =>
  flag({
    key,
    defaultValue: false,
    async decide() {
      return (await decide()) ?? (this.defaultValue as boolean);
    },
  });
