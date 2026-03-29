export const ROUTES = {
  home: "/",
  room: (roomId: string) => `/room/${roomId}`,
} as const;

