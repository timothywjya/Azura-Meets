import { create } from 'zustand';

interface ChatMessage {
    sender: string;
    text: string;
    time: string;
    isAI?: boolean;
}

interface MeetingState {
    userName: string;
    roomName: string;
    isMuted: boolean;
    isCameraOff: boolean;
    isRaisedHand: boolean;
    admins: string[];
    messages: ChatMessage[];
    setUserName: (name: string) => void;
    setRoomName: (room: string) => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    toggleRaiseHand: () => void;
    addAdmin: (name: string) => void;
    removeAdmin: (name: string) => void;
    addMessage: (msg: ChatMessage) => void;
    clearStore: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
    userName: '',
    roomName: '',
    isMuted: false,
    isCameraOff: false,
    isRaisedHand: false,
    admins: [],
    messages: [],

    setUserName: (name) => set({ userName: name }),
    setRoomName: (room) => set({ roomName: room }),

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
    toggleRaiseHand: () => set((state) => ({ isRaisedHand: !state.isRaisedHand })),

    addAdmin: (name) => set((state) => {
        if (state.admins.includes(name) || state.admins.length >= 3) return state;
        return { admins: [...state.admins, name] };
    }),

    removeAdmin: (name) => set((state) => ({
        admins: state.admins.filter(admin => admin !== name)
    })),

    addMessage: (msg) => set((state) => ({
        messages: [...state.messages, msg]
    })),

    clearStore: () => set({
        userName: '',
        roomName: '',
        isMuted: false,
        isCameraOff: false,
        isRaisedHand: false,
        admins: [],
        messages: []
    })
}));