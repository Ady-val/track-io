export const WEBSOCKET_EVENTS = {
  NEW_RAW_SIGNAL: 'new_raw_signal',

  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  SYSTEM_MESSAGE: 'system_message',
} as const;

export type WebSocketEvent =
  (typeof WEBSOCKET_EVENTS)[keyof typeof WEBSOCKET_EVENTS];
