export const SELECTRON_VERSION = "0.6.0-rebaseline.0";
export const FIGURE_GENERATION_COMMIT = "538e16ccff94";

declare const __SELECTRON_SOURCE_COMMIT__: string | undefined;

const BUILD_SOURCE_COMMIT =
  typeof __SELECTRON_SOURCE_COMMIT__ === "string" &&
  __SELECTRON_SOURCE_COMMIT__.trim().length > 0
    ? __SELECTRON_SOURCE_COMMIT__
    : undefined;

const ENV_SOURCE_COMMIT =
  typeof process !== "undefined" &&
  typeof process.env?.VITE_GIT_COMMIT === "string" &&
  process.env.VITE_GIT_COMMIT.trim().length > 0
    ? process.env.VITE_GIT_COMMIT
    : undefined;

export const SELECTRON_SOURCE_COMMIT =
  BUILD_SOURCE_COMMIT ?? import.meta.env.VITE_GIT_COMMIT ?? ENV_SOURCE_COMMIT ?? FIGURE_GENERATION_COMMIT;
