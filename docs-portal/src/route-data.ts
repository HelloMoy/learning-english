import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

import { paginationWithinStarlight } from "./outbound-links.mjs";

/** Starlight route middleware: previous/next links never leave Starlight. */
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  route.pagination = paginationWithinStarlight(route.pagination);
});
