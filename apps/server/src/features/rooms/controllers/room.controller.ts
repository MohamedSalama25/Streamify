import type { Request, Response } from "express";

import type { RoomService } from "../services/room-service.js";

export function createRoomController(roomService: RoomService) {
    return (req: Request, res: Response): void => {
        const roomId = req.params.roomId as string;

        if (!roomService.roomExists(roomId)) {
            res.status(404).json({
                ok: false,
                error: { code: "ROOM_NOT_FOUND", message: "That room does not exist or has expired." },
            });
            return;
        }

        const participants = roomService.listParticipants(roomId);

        res.json({
            ok: true,
            data: {
                roomId,
                participants,
            },
        });
    };
}
