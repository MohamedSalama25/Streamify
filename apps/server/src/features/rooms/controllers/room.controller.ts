import type { Request, Response } from "express";

import type { RoomService } from "../services/room-service.js";

export function createRoomController(roomService: RoomService) {
    return (req: Request, res: Response): void => {
        const roomId = req.params.roomId as string;

        // We attempt to get the room via listParticipants instead of directly exposing internal state
        const participants = roomService.listParticipants(roomId);

        if (!participants) {
            res.status(404).json({
                ok: false,
                error: { code: "ROOM_NOT_FOUND", message: "That room does not exist or has expired." },
            });
            return;
        }

        // Since we don't have separate room titles or topics persisted in the InMemoryRoomStore currently,
        // we can return the roomId and the list of participants to populate the "Waiting Room" screen.
        res.json({
            ok: true,
            data: {
                roomId,
                participants,
            },
        });
    };
}
