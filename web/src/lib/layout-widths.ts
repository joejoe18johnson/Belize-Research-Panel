/** Primary app content width: max-w-4xl (56rem) + 20%. */
export const APP_CONTENT_MAX = "max-w-[67.2rem]";

/** Auth and narrow form width: max-w-lg (32rem) + 20%. */
export const AUTH_CONTENT_MAX = "max-w-[38.4rem]";

/** Medium content width: max-w-2xl (42rem) + 20%. */
export const MEDIUM_CONTENT_MAX = "max-w-[50.4rem]";

/** Side inset so content is not flush with the viewport edge. */
export const APP_CONTENT_GUTTER = "px-4 sm:px-6 lg:px-8 xl:px-10";

export const appContentClass = `mx-auto w-full ${APP_CONTENT_MAX}`;

/** Centered content column with horizontal breathing room. */
export const appContentFrameClass = `mx-auto w-full min-w-0 ${APP_CONTENT_MAX} ${APP_CONTENT_GUTTER}`;

export const authContentClass = `mx-auto w-full ${AUTH_CONTENT_MAX}`;

/** Full-page wrapper that stays inside tablet and phone viewports. */
export const pageRootClass = "min-h-screen min-w-0 w-full max-w-full overflow-x-clip";
