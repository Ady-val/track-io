const DEFAULT_NODE_RED_EVENTS_URL = 'http://localhost:1880/events';

/**
 * Node-RED HTTP In URL for outbound payloads (torreta / alert messages).
 *
 * Priority: `NODE_RED_EVENTS_URL` env → `configuredUrl` (e.g. from DB) → localhost default.
 *
 * In Docker, `localhost` is the container. Set `NODE_RED_EVENTS_URL` to the host address
 * Node-RED listens on (e.g. `http://192.168.1.88:1880/events` or
 * `http://host.docker.internal:1880/events` when supported).
 */
export function resolveNodeRedEventsUrl(configuredUrl?: string): string {
  const fromEnv = process.env['NODE_RED_EVENTS_URL']?.trim();
  if (fromEnv) return fromEnv;
  const fromConfig = configuredUrl?.trim();
  if (fromConfig) return fromConfig;
  return DEFAULT_NODE_RED_EVENTS_URL;
}
