import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  previewPersonas,
  storageStateEnvironmentName,
  validateAuthenticatedPreviewEnvironment,
  writeProtectedStorageState,
} from "../apps/e2e/fixtures/authenticated-preview-contract.mts";

export { decodeStorageState } from "../apps/e2e/fixtures/authenticated-preview-contract.mts";

export const materializeReleaseStates = async ({
  environment = process.env,
  now = new Date(),
  outputDirectory,
  states,
}) => {
  if (!outputDirectory) {
    throw new Error("A protected output directory is required");
  }

  validateAuthenticatedPreviewEnvironment(environment);
  const targetDirectory = resolve(outputDirectory);

  try {
    for (const persona of previewPersonas) {
      let state = states?.[persona];
      if (!state) {
        const sourcePath = environment[storageStateEnvironmentName(persona)];
        if (!sourcePath) {
          throw new Error(
            `${storageStateEnvironmentName(persona)} is required`
          );
        }
        try {
          state = JSON.parse(await readFile(sourcePath, "utf8"));
        } catch {
          throw new Error(
            `${persona} storage-state source is missing or invalid`
          );
        }
      }
      await writeProtectedStorageState(
        targetDirectory,
        persona,
        state,
        environment,
        now
      );
    }
    return targetDirectory;
  } catch (error) {
    await rm(targetDirectory, { force: true, recursive: true });
    throw error;
  }
};

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  await materializeReleaseStates({ outputDirectory: process.argv[2] });
  process.stdout.write("Prepared five protected Preview persona states.\n");
}
