import { RoomClient } from "@/features/room/components/room-client";
import { notFound } from "next/navigation";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  if (!roomId) {
    notFound();
  }

  return <RoomClient roomId={roomId.toUpperCase()} />;
}
