/** Shared native-input and server-validation limits; no browser or server imports. */
export const publicContactLimits = {
  name: { min: 2, max: 100 },
  phone: { min: 7, max: 40 },
  email: { max: 254 },
} as const;
