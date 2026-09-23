import { getAuth } from "@/lib/auth/auth";

import { toNextJsHandler } from "better-auth/next-js";

// A function rather than the instance: the auth instance reads the validated
// environment, which `next build` does not have.
export const { GET, POST } = toNextJsHandler((request: Request) => getAuth().handler(request));
