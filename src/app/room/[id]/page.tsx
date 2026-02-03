"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/useMeetingStore';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare,
    MessageCircle, LogOut, ShieldCheck, Sparkles,
    Send, Download, Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

export default function MeetingRoom({ params }: { params: { id: string } }) {
    const router = useRouter();
    const {
        userName, roomName, admins, addAdmin, removeAdmin,
        messages, addMessage, isMuted, toggleMute,
        isCameraOff, toggleCamera, clearStore
    } = useMeetingStore();

    const [chatOpen, setChatOpen] = useState(false);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // 1. LOGIKA PERSISTENCE & CLEANUP (Sangat Penting)
    useEffect(() => {
        // Auto-redirect jika user mencoba masuk lewat URL tanpa input nama
        if (!userName) {
            router.push('/');
            return;
        }

        const handleExit = () => {
            const saved = localStorage.getItem('azura_active_meetings');
            if (saved) {
                let allRooms = JSON.parse(saved);
                const roomIdx = allRooms.findIndex((r: any) => r.id === params.id);

                if (roomIdx !== -1) {
                    // Hapus user ini dari daftar admin di localStorage
                    allRooms[roomIdx].admins = allRooms[roomIdx].admins.filter((a: string) => a !== userName);

                    // Jika tidak ada admin tersisa, hapus room sepenuhnya
                    if (allRooms[roomIdx].admins.length === 0) {
                        allRooms = allRooms.filter((r: any) => r.id !== params.id);
                    }

                    localStorage.setItem('azura_active_meetings', JSON.stringify(allRooms));
                }
            }
            removeAdmin(userName);
        };

        // Deteksi jika tab ditutup atau di-refresh
        window.addEventListener('beforeunload', handleExit);

        return () => {
            handleExit();
            window.removeEventListener('beforeunload', handleExit);
        };
    }, [userName, params.id, router, removeAdmin]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const isAdmin = admins.includes(userName);

    const downloadLog = () => {
        const header = `=== AZURA.AI MEETING LOG ===\nRoom: ${roomName || params.id}\nDate: ${new Date().toLocaleDateString()}\nAdmins: ${admins.join(', ')}\n----------------------------\n\n`;
        const body = messages.map(m => `[${m.time}] ${m.sender}: ${m.text}`).join('\n');

        const blob = new Blob([header + body], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Log_${roomName || params.id}.txt`;
        a.click();
    };

    const handleEndCall = () => {
        const message = isAdmin
            ? "You are an Admin. Close meeting for all or just leave?"
            : "Are you sure you want to leave the meeting?";

        Swal.fire({
            title: isAdmin ? 'End Meeting?' : 'Leave Meeting?',
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: isAdmin ? 'Download Log & End' : 'Leave',
            cancelButtonText: 'Stay Here',
            confirmButtonColor: '#6366f1',
            customClass: {
                popup: 'rounded-[2.5rem] border-none shadow-2xl',
                confirmButton: 'rounded-2xl px-6 py-3 font-bold',
                cancelButton: 'rounded-2xl px-6 py-3 font-bold'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                if (isAdmin) downloadLog();
                clearStore();
                router.push('/');
            }
        });
    };

    const sendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgInput.trim()) return;
        addMessage({
            sender: userName,
            text: msgInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setMsgInput('');
    };

    return (
        <div className="h-screen bg-[#FDFCF0] flex flex-col md:flex-row p-4 gap-4 overflow-hidden font-sans text-slate-700">

            {/* AREA VIDEO UTAMA */}
            <div className="flex-1 flex flex-col relative">
                {/* Header Room */}
                <div className="flex justify-between items-center px-4 py-2 bg-white/50 backdrop-blur-md rounded-2xl border border-white mb-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center animate-bounce">
                            <Sparkles size={16} className="text-indigo-500" />
                        </div>
                        <span className="font-black tracking-tight text-lg italic text-slate-800 uppercase tracking-tighter">
                            {roomName || params.id}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {admins.map((admin, i) => (
                            <div key={i} className="flex items-center gap-1 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-200">
                                <ShieldCheck size={12} /> {admin === userName ? "You" : admin}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-[2.5rem] border-8 border-white shadow-2xl relative overflow-hidden group transition-all">
                        {isCameraOff ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-black text-indigo-400 shadow-xl border-4 border-indigo-50">
                                    {userName?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/20 italic font-bold uppercase tracking-widest text-xs">
                                Live Feed Active
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold border border-white/30">
                            {userName} {isAdmin && "⭐"}
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-[2.5rem] border-8 border-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-emerald-50 flex items-center justify-center text-center p-6">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-2xl font-black text-blue-400 shadow-xl border-4 border-blue-50 animate-pulse">
                                    AZ
                                </div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-tight">
                                    Azura.AI <br /> Recording & Logging...
                                </p>
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold border border-white/30">
                            Virtual Meeting Node
                        </div>
                    </div>
                </div>

                {/* FLOATING CONTROLS */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-xl px-6 py-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white z-50">
                    <ControlButton
                        active={!isMuted}
                        onClick={toggleMute}
                        icon={isMuted ? <MicOff /> : <Mic />}
                        color="indigo"
                    />
                    <ControlButton
                        active={!isCameraOff}
                        onClick={toggleCamera}
                        icon={isCameraOff ? <VideoOff /> : <VideoIcon />}
                        color="purple"
                    />
                    <div className="w-[1px] h-8 bg-slate-100 mx-1" />
                    <ControlButton icon={<ScreenShare />} color="blue" />
                    <ControlButton
                        icon={<MessageCircle />}
                        color="sage"
                        onClick={() => setChatOpen(!chatOpen)}
                        badge={messages.length}
                    />
                    <button
                        onClick={handleEndCall}
                        className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 hover:bg-red-600 transition-all hover:rotate-12"
                    >
                        <LogOut />
                    </button>
                </div>
            </div>

            {/* CHAT SIDEBAR */}
            <div className={cn(
                "bg-white rounded-[2rem] border border-slate-100 shadow-2xl transition-all duration-500 flex flex-col overflow-hidden",
                chatOpen ? "w-full md:w-[380px] opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-10 pointer-events-none"
            )}>
                <div className="p-6 border-b border-slate-50 bg-indigo-50/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase text-sm">
                            Chat Log <Sparkles size={14} className="text-indigo-400" />
                        </h3>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Azura.AI Secured</p>
                    </div>
                    {isAdmin && (
                        <button onClick={downloadLog} className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm hover:scale-110 transition-transform">
                            <Download size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((m, i) => (
                        <div key={i} className={cn("flex flex-col", m.sender === userName ? "items-end" : "items-start")}>
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-xs font-bold shadow-sm max-w-[85%]",
                                m.sender === userName ? "bg-indigo-600 text-white rounded-tr-none" : "bg-indigo-50 text-slate-700 rounded-tl-none"
                            )}>
                                {m.text}
                            </div>
                            <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">
                                {m.sender} • {m.time}
                            </span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendChat} className="p-4 bg-slate-50/50 flex gap-2">
                    <input
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        placeholder="Say hello to Azura..."
                        className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-[11px] font-bold focus:border-indigo-300 outline-none transition-all"
                    />
                    <button type="submit" className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 hover:scale-110 transition-transform">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}

function ControlButton({ icon, color, active = true, onClick, badge }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-600",
        purple: "bg-purple-50 text-purple-600",
        blue: "bg-blue-50 text-blue-600",
        sage: "bg-emerald-50 text-emerald-600",
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative group shadow-sm",
                active ? colors[color] : "bg-red-50 text-red-500",
                "hover:scale-110 active:scale-95"
            )}
        >
            {icon}
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {badge}
                </span>
            )}
        </button>
    );
}