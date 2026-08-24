/**
 * Which surface reported the error, and where on that surface it was caught.
 *
 * The website's two values are set by the two producers: `WEBSITE_SERVER` by
 * `onRequestError` (SSR/RSC render, route handlers, server actions) and
 * `WEBSITE_CLIENT` by the browser reporter. They are worth distinguishing
 * because the fix differs — a server report carries our stack and route, a
 * client one carries the customer's browser and device.
 *
 * **Never taken from the browser's payload.** `/api/report-error` overwrites
 * whatever a page sent with `WEBSITE_CLIENT`, so a crafted body cannot pass
 * itself off as a server failure, and `DASHBOARD` is supplied by its controller
 * rather than accepted as a field at all.
 */
export enum ErrorReportSourceEnum {
  WEBSITE_SERVER = 'website-server',
  WEBSITE_CLIENT = 'website-client',
  DASHBOARD = 'dashboard',
}

/** Values `POST /client/errors` will accept — the website's two, never the dashboard's. */
export const WEBSITE_ERROR_SOURCES = [
  ErrorReportSourceEnum.WEBSITE_SERVER,
  ErrorReportSourceEnum.WEBSITE_CLIENT,
] as const;
