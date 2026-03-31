const CREATOR_KEY = "streamify.room-creator";

export function getCreatedRoomIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CREATOR_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

export function markAsCreator(roomId: string) {
    if (typeof window === "undefined") return;
    const ids = getCreatedRoomIds();
    if (!ids.includes(roomId)) {
        ids.push(roomId);
        localStorage.setItem(CREATOR_KEY, JSON.stringify(ids));
    }
}

export function isRoomCreator(roomId: string): boolean {
    return getCreatedRoomIds().includes(roomId);
}
