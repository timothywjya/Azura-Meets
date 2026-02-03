"use client"

import { useState, useEffect, useRef, use as reactUse } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/useMeetingStore';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare,
    MessageCircle, LogOut, ShieldCheck, Sparkles,
    MonitorOff, Hand, Pin, UserMinus, X, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
};

export default function MeetingRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = reactUse(params);
    const router = useRouter();

    const {
        userName, setUserName, messages, isMuted, toggleMute,
        isCameraOff, toggleCamera, admins
    } = useMeetingStore();

    const [chatOpen, setChatOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [raisedHands, setRaisedHands] = useState<string[]>([]);

    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const videoElem = useRef<HTMLVideoElement>(null);
    const screenElem = useRef<HTMLVideoElement>(null);

    // --- 1. SYNC & INITIALIZATION ---
    useEffect(() => {
        if (!userName) {
            const saved = localStorage.getItem('azura_user_name');
            if (saved) setUserName(saved);
            else router.push('/');
        }

        const handleSync = () => {
            const hands = localStorage.getItem(`hands_${roomId}`);
            if (hands) setRaisedHands(JSON.parse(hands));
        };

        window.addEventListener('storage', handleSync);
        return () => window.removeEventListener('storage', handleSync);
    }, [roomId, userName, router, setUserName]);

    // --- 2. CAMERA & MIC LOGIC ---
    useEffect(() => {
        async function initMedia() {
            try {
                if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
                if (!isCameraOff) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localStreamRef.current = stream;
                    stream.getAudioTracks().forEach(t => t.enabled = !isMuted);
                    if (videoElem.current) videoElem.current.srcObject = stream;
                }
            } catch (err) { console.error("Camera error:", err); }
        }
        initMedia();
    }, [isCameraOff, isMuted]);

    // --- 3. FIX SHARE SCREEN LOGIC ---
    // Watcher untuk memastikan stream menempel ke video element setelah render
    useEffect(() => {
        if (isSharing && screenStreamRef.current && screenElem.current) {
            screenElem.current.srcObject = screenStreamRef.current;
        }
    }, [isSharing]);

    const handleToggleShare = async () => {
        if (!isSharing) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" } as any
                });
                screenStreamRef.current = stream;
                setIsSharing(true);

                stream.getVideoTracks()[0].onended = () => {
                    stopSharing();
                };
            } catch (err) { console.log("Share screen cancelled"); }
        } else {
            stopSharing();
        }
    };

    const stopSharing = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        setIsSharing(false);
    };

    // --- 4. RAISE HAND LOGIC ---
    const handleRaiseHand = () => {
        let current = JSON.parse(localStorage.getItem(`hands_${roomId}`) || "[]");
        current = current.includes(userName) ? current.filter((n: string) => n !== userName) : [...current, userName];
        localStorage.setItem(`hands_${roomId}`, JSON.stringify(current));
        window.dispatchEvent(new Event('storage'));
        setRaisedHands(current);
    };

    // --- 5. DOWNLOAD SUMMARY LOGIC ---
    const handleDownloadSummary = () => {
        Swal.fire({
            title: 'DOWNLOAD RANGKUMAN?',
            text: "Azura AI akan menyusun catatan pertemuan ini untukmu.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'YA, DOWNLOAD!',
            cancelButtonText: 'NANTI SAJA',
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            background: '#FDFCF0',
            customClass: {
                popup: 'border-[6px] border-slate-900 rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] font-sans',
                title: 'font-black italic uppercase tracking-tighter',
                confirmButton: 'border-4 border-slate-900 font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                cancelButton: 'border-4 border-slate-900 font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const content = `AZURA AI MEETING SUMMARY\nRoom: ${roomId}\nUser: ${userName}\nDate: ${new Date().toLocaleString()}\n\nNote: Pertemuan berlangsung dengan lancar.`;
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Azura_Summary_${roomId}.txt`;
                a.click();

                Swal.fire({
                    title: 'BERHASIL!',
                    text: 'Rangkuman telah tersimpan di perangkatmu.',
                    icon: 'success',
                    confirmButtonColor: '#10b981'
                });
            }
        });
    };

    return (
        <div className="h-screen bg-[#FDFCF0] flex flex-col p-3 gap-3 overflow-hidden font-sans text-slate-900">

            {/* 1. HEADER */}
            <header className="flex justify-between items-center px-6 py-3 bg-white border-[4px] border-slate-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 border-2 border-slate-900 rounded-xl flex items-center justify-center text-white rotate-2 shadow-sm">
                        <Sparkles size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg uppercase tracking-tighter leading-none italic">{roomId}</h1>
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-none mt-1">Azura AI Studio</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadSummary}
                        className="p-2 bg-white border-[3px] border-slate-900 rounded-xl hover:bg-indigo-50 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                        title="Download Summary"
                    >
                        <Download size={18} className="text-slate-900" />
                    </button>
                    <div className="px-4 py-1.5 bg-emerald-400 border-[3px] border-slate-900 rounded-full flex items-center gap-2">
                        <ShieldCheck size={14} className="text-slate-900" />
                        <span className="text-[11px] font-black uppercase text-slate-900">{userName}</span>
                    </div>
                </div>
            </header>

            {/* 2. MAIN AREA */}
            <div className="flex-1 flex gap-4 overflow-hidden relative">

                {/* RAISE HAND OVERLAY */}
                {raisedHands.length > 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                        <div className="bg-amber-300 border-[3px] border-slate-900 px-4 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                            <span className="text-lg">🙌</span>
                            <p className="text-[11px] font-black uppercase italic">
                                {raisedHands.length === 1 ? `${raisedHands[0]} raised hand!` : `${raisedHands[0]} & others waving!`}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col gap-3 relative h-full">
                    {/* VIDEO GRID */}
                    <div className={cn(
                        "flex-1 grid gap-4 p-1 h-full transition-all duration-500",
                        isSharing ? "grid-cols-12" : "grid-cols-1 md:grid-cols-2"
                    )}>
                        {/* SHARE SCREEN VIEW */}
                        {isSharing && (
                            <div className="col-span-9 bg-slate-900 rounded-[2.5rem] border-[4px] border-slate-900 overflow-hidden relative shadow-inner">
                                <video ref={screenElem} autoPlay playsInline className="w-full h-full object-contain" />
                                <div className="absolute top-4 left-4 bg-red-500 border-2 border-slate-900 px-3 py-1 rounded-xl text-white font-black text-[9px] uppercase animate-pulse">
                                    LIVE PRESENTING
                                </div>
                            </div>
                        )}

                        {/* CAMERA VIEW */}
                        <div className={cn(
                            "relative bg-white rounded-[2.5rem] border-[4px] border-slate-900 overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]",
                            isSharing ? "col-span-3 aspect-video md:aspect-auto self-center" : "w-full h-full"
                        )}>
                            {!isCameraOff ? (
                                <video ref={videoElem} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                    <div className="w-24 h-24 bg-white border-[4px] border-slate-900 rounded-full flex items-center justify-center shadow-lg rotate-3">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{getInitials(userName || "User")}</span>
                                    </div>
                                </div>
                            )}

                            {/* NAME TAG */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                <div className="bg-white border-[3px] border-slate-900 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase text-slate-900 shadow-sm flex items-center gap-2">
                                    {userName} {isMuted && <MicOff size={10} className="text-red-500" />}
                                </div>
                            </div>
                        </div>

                        {!isSharing && (
                            <div className="bg-indigo-50 rounded-[2.5rem] border-[4px] border-slate-900 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className={cn("w-20 h-20 rounded-3xl border-[3px] border-slate-900 flex items-center justify-center text-white transition-all duration-500", !isMuted ? "bg-indigo-600 scale-110 rotate-6 shadow-xl" : "bg-slate-300 -rotate-6")}>
                                    <Sparkles size={32} />
                                </div>
                                <h2 className="mt-4 font-black text-xl uppercase italic tracking-tighter">Azura AI</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Waiting for your genius...</p>
                            </div>
                        )}
                    </div>

                    {/* DOCK CONTROLS */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white border-[4px] border-slate-900 p-3.5 rounded-[2rem] shadow-[0_8px_0_0_rgba(0,0,0,1)] z-50">
                        <CuteButton onClick={toggleMute} active={!isMuted} color="indigo" icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />} />
                        <CuteButton onClick={toggleCamera} active={!isCameraOff} color="purple" icon={isCameraOff ? <VideoOff size={20} /> : <VideoIcon size={20} />} />
                        <CuteButton onClick={handleRaiseHand} active={raisedHands.includes(userName)} color="amber" icon={<Hand size={20} />} />
                        <div className="w-[2px] h-8 bg-slate-900/20 mx-1 rounded-full" />
                        <CuteButton onClick={handleToggleShare} active={isSharing} color="sky" icon={isSharing ? <MonitorOff size={20} /> : <ScreenShare size={20} />} />
                        <CuteButton onClick={() => setChatOpen(!chatOpen)} active={chatOpen} color="emerald" icon={<MessageCircle size={20} />} />
                        <button onClick={() => router.push('/')} className="w-12 h-12 bg-red-500 border-[3px] border-slate-900 text-white rounded-2xl flex items-center justify-center hover:translate-y-0.5 hover:shadow-none transition-all shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:scale-95">
                            <LogOut size={22} />
                        </button>
                    </div>
                </div>

                {/* SIDEBAR CHAT */}
                <aside className={cn(
                    "bg-white border-[4px] border-slate-900 transition-all duration-500 flex flex-col overflow-hidden rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]",
                    chatOpen ? "w-[350px]" : "w-0 opacity-0 pointer-events-none"
                )}>
                    <div className="p-6 border-b-[4px] border-slate-900 bg-indigo-50 flex justify-between items-center">
                        <h2 className="font-black text-lg uppercase italic tracking-tighter">Chat Log</h2>
                        <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors border-2 border-slate-900">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFCF0]">
                        <div className="text-center py-10 opacity-30 italic font-bold text-[10px] uppercase tracking-widest">No messages yet</div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function CuteButton({ icon, color, active, onClick }: any) {
    const activeColors: any = {
        indigo: "bg-indigo-400",
        purple: "bg-purple-400",
        amber: "bg-amber-400",
        sky: "bg-sky-400",
        emerald: "bg-emerald-400",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-12 h-12 border-[3px] border-slate-900 rounded-2xl flex items-center justify-center transition-all relative",
                "shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:scale-95",
                active ? activeColors[color] : "bg-slate-50 opacity-60 grayscale-[0.5]"
            )}
        >
            {icon}
        </button>
    );
}