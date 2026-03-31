export const en = {
    dir: "ltr" as const,
    lang: "en" as const,
    nav: {
        dashboard: "Dashboard",
        sessions: "Sessions",
        resources: "Resources",
        guestUser: "Guest User",
    },
    hero: {
        badge: "Streamlined real-time rooms",
        titlePre: "Real-time",
        titleHighlight: "collaboration,",
        titlePost: "simplified",
        description:
            "Experience the next generation of digital meeting environments. High-fidelity sync, architectural clarity, and professional-grade security built for elite teams.",
    },
    features: {
        audio: {
            title: "High-fidelity audio",
            description: "Crystal-clear, low-latency audio powered by Mesh WebRTC for up to 4 participants.",
        },
        security: {
            title: "Secure by default",
            description: "End-to-end peer connections with Express signaling, rooms, and ICE config.",
        },
        screenShare: {
            title: "Screen sharing",
            description: "Feature-first UI structured for seamless screen sharing and future SFU migration.",
        },
    },
    session: {
        title: "Initialize Session",
        description: "Create a new elite space or join an existing one.",
        displayName: "Display name",
        displayNamePlaceholder: "How people should see you",
        createRoom: "Create Private Room",
        or: "OR",
        roomCode: "Room code",
        roomCodePlaceholder: "ENTER CODE",
        joinSession: "Join Session",
        noSignal: "No active signal",
        hint: "Share the invite link after creating a room. This MVP allows up to 4 participants so the mesh stays stable.",
        guestJoinTitle: "You're invited to join",
        guestJoinSubtitle: "Enter your name to join the meeting",
        guestJoinPlaceholder: "Enter your name",
        guestJoinButton: "Join Meeting",
        guestJoinSecure: "Secure Connection",
        guestJoinHd: "HD Quality",
        guestJoinEncrypted: "Encrypted",
        guestJoinReady: "Ready to join?",
        guestJoinReadyDesc: "You'll be connected to all participants in the room with high-quality audio and video.",
        waitingTitle: "Waiting for host",
        waitingDesc: "The host has been notified. You'll be admitted once they approve your request.",
        waitingSecure: "Secure encrypted connection",
        rejectedTitle: "Request declined",
        rejectedDesc: "The host has declined your request to join this meeting.",
        rejectedBack: "Back to lobby",
        cancelRequest: "Cancel Request",
    },
    focus: {
        title: "Designed for Focus",
        description:
            "The interface recedes when not in use, leaving only the essential controls within reach. Streamify Elite utilizes architectural layering to reduce cognitive load during high-stakes sessions.",
    },
    theme: {
        light: "Light",
        dark: "Dark",
    },
    language: {
        en: "EN",
        ar: "AR",
    },
} as const;

type DeepString<T> = {
    [P in keyof T]: T[P] extends string
    ? string
    : T[P] extends object
    ? DeepString<T[P]>
    : T[P];
};

export type Dictionary = DeepString<typeof en>;
