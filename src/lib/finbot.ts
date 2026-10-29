/**
 * The separate finance bot's web API (portfolio-api/internal/finbot).
 *
 * In production the Mini App and this API share one origin: Caddy serves
 * hisob.<domain>/pul from this dashboard and hisob.<domain>/api/* from the
 * finance bot, so the default is a relative path and needs no build
 * argument. For local development point it at the bot directly, e.g.
 * NEXT_PUBLIC_FINBOT_API_URL=http://localhost:8090/api (and set
 * FINBOT_CORS_ORIGINS=http://localhost:3001 on the bot).
 */
export const FINBOT_API_URL = process.env.NEXT_PUBLIC_FINBOT_API_URL ?? "/api";

/** Where init data is traded for a token, relative to FINBOT_API_URL. */
export const FINBOT_AUTH_PATH = "/auth";
