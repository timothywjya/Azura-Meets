"use client"

import { useState, useEffect, useRef, use as reactUse } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/useMeetingStore';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare,
    MessageCircle, LogOut, ShieldCheck, Sparkles,
    Send, Download, Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function MeetingRoom({ params }: PageProps) {
    // 1. UNWRAP PARAMS - Gunakan 'use' untuk mendapatkan id secara asinkron
    const resolvedParams = reactUse(params);
    const roomId = resolvedParams.id;

    const router = useRouter();
    const {
        userName, roomName, admins, removeAdmin,
        messages, addMessage, isMuted, toggleMute,
        isCameraOff, toggleCamera, clearStore,
        isRaisedHand, toggleRaiseHand
    } = useMeetingStore();

    const [chatOpen, setChatOpen] = useState(false);
    const [msgInput, setMsgInput] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [globalHandRaise, setGlobalHandRaise] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    // 2. MEDIA LOGIC
    useEffect(() => {
        async function setupMedia() {
            try {
                if (!isCameraOff && !isSharing) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                } else if (isCameraOff && !isSharing) {
                    const stream = videoRef.current?.srcObject as MediaStream;
                    stream?.getTracks().forEach(track => track.stop());
                    if (videoRef.current) videoRef.current.srcObject = null;
                }
            } catch (err) {
                console.error("Media access error:", err);
            }
        }
        setupMedia();
    }, [isCameraOff, isSharing]);

    // 3. CLEANUP & PERSISTENCE LOGIC
    // Pastikan roomId masuk ke dependency array agar useEffect sinkron dengan unwrap params
    useEffect(() => {
        if (!userName) {
            router.push('/');
            return;
        }

        const handleExit = () => {
            const saved = localStorage.getItem('azura_active_meetings');
            if (saved) {
                let allRooms = JSON.parse(saved);
                // roomId di sini sekarang aman karena useEffect hanya jalan setelah roomId ter-resolve
                const roomIdx = allRooms.findIndex((r: any) => r.id === roomId);

                if (roomIdx !== -1) {
                    allRooms[roomIdx].admins = allRooms[roomIdx].admins.filter((a: string) => a !== userName);
                    if (allRooms[roomIdx].admins.length === 0) {
                        allRooms = allRooms.filter((r: any) => r.id !== roomId);
                    }
                    localStorage.setItem('azura_active_meetings', JSON.stringify(allRooms));
                }
            }
            removeAdmin(userName);
        };

        window.addEventListener('beforeunload', handleExit);
        return () => {
            handleExit();
            window.removeEventListener('beforeunload', handleExit);
        };
    }, [userName, roomId, router, removeAdmin]); // roomId WAJIB ada di sini

    // 4. UI HANDLERS
    const handleShareScreen = async () => {
        try {
            if (!isSharing) {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
                setIsSharing(true);
                stream.getVideoTracks()[0].onended = () => setIsSharing(false);
            } else {
                screenStreamRef.current?.getTracks().forEach(t => t.stop());
                setIsSharing(false);
            }
        } catch (err) { console.log("Canceled"); }
    };

    const handleRaiseHand = () => {
        toggleRaiseHand();
        if (!isRaisedHand) {
            setGlobalHandRaise(userName);
            setTimeout(() => setGlobalHandRaise(null), 5000);
        }
    };

    const isAdmin = admins.includes(userName);

    const handleEndCall = () => {
        Swal.fire({
            title: isAdmin ? 'End Meeting?' : 'Leave Meeting?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
        }).then((result) => {
            if (result.isConfirmed) {
                clearStore();
                router.push('/');
            }
        });
    };

    return (
        <div className="h-screen bg-[#FDFCF0] flex flex-col md:flex-row p-4 gap-4 overflow-hidden font-sans text-slate-700">
            {/* Banner Angkat Tangan */}
            {globalHandRaise && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce bg-yellow-400 border-4 border-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4">
                    <span className="text-3xl">✋</span>
                    <p className="font-black text-slate-800 text-sm uppercase">{globalHandRaise} Ingin Bicara!</p>
                </div>
            )}

            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-2 bg-white/50 backdrop-blur-md rounded-2xl border border-white mb-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" />
                        <span className="font-black text-lg italic text-slate-800 uppercase tracking-tighter">
                            {roomName || roomId}
                        </span>
                    </div>
                </div>

                {/* Video Container */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden">
                    <div className="bg-slate-900 rounded-[2.5rem] border-8 border-white shadow-2xl relative overflow-hidden group">
                        <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover", (isCameraOff && !isSharing) && "hidden")} />
                        {(isCameraOff && !isSharing) && (
                            <div className="absolute inset-0 bg-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-400">
                                {userName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-800 rounded-[2.5rem] border-8 border-white shadow-2xl flex items-center justify-center">
                        <p className="text-blue-400 font-bold uppercase tracking-widest animate-pulse">Azura Node Active</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-xl px-6 py-4 rounded-[2.5rem] shadow-2xl border border-white">
                    <ControlButton active={!isMuted} onClick={toggleMute} icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />} color="indigo" />
                    <ControlButton active={!isCameraOff} onClick={toggleCamera} icon={isCameraOff ? <VideoOff size={20} /> : <VideoIcon size={20} />} color="purple" />
                    <button onClick={handleRaiseHand} className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", isRaisedHand ? "bg-yellow-400 text-white" : "bg-slate-50 text-slate-500")}>
                        <Hand size={20} fill={isRaisedHand ? "currentColor" : "none"} />
                    </button>
                    <ControlButton active={!isSharing} onClick={handleShareScreen} icon={<ScreenShare size={20} />} color="blue" />
                    <ControlButton icon={<MessageCircle size={20} />} color="sage" onClick={() => setChatOpen(!chatOpen)} badge={messages.length} />
                    <button onClick={handleEndCall} className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><LogOut size={20} /></button>
                </div>
            </div>

            {/* Chat Sidebar */}
            {chatOpen && (
                <div className="w-full md:w-[380px] bg-white rounded-[2rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b font-black text-slate-800 text-xs uppercase">Chat Bubbles</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex flex-col", m.sender === userName ? "items-end" : "items-start")}>
                                <div className={cn("px-4 py-2 rounded-2xl text-[11px] font-bold", m.sender === userName ? "bg-indigo-600 text-white" : "bg-indigo-50 text-slate-700")}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if (msgInput.trim()) { addMessage({ sender: userName, text: msgInput, time: 'Now' }); setMsgInput(''); } }} className="p-4 bg-slate-50 flex gap-2">
                        <input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder="Tulis pesan..." className="flex-1 bg-white border-2 rounded-2xl px-4 py-2 text-xs outline-none" />
                        <button type="submit" className="bg-indigo-600 text-white p-3 rounded-2xl"><Send size={18} /></button>
                    </form>
                </div>
            )}
        </div>
    );
}

function ControlButton({ icon, color, active = true, onClick, badge }: any) {
    const colors: any = {
        indigo: active ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-500",
        purple: active ? "bg-purple-50 text-purple-600" : "bg-red-50 text-red-500",
        blue: active ? "bg-blue-50 text-blue-600" : "bg-blue-600 text-white",
        sage: "bg-emerald-50 text-emerald-600",
    };
    return (
        <button onClick={onClick} className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative shadow-sm", colors[color], "hover:scale-110")}>
            {icon}
            {badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">{badge}</span>}
        </button>
    );
}