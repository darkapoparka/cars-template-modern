export const createDatabaseToolEnvironment = (
  environment: NodeJS.ProcessEnv,
  databaseUrl: string
) => {
  const sanitizedEnvironment = Object.fromEntries(
    Object.entries(environment).filter(
      ([name]) => name !== "SHADOW_DATABASE_URL"
    )
  );
  sanitizedEnvironment.DATABASE_URL = databaseUrl;
  return sanitizedEnvironment;
};
