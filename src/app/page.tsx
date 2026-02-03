"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/useMeetingStore';
import { PlusCircle, ArrowRight, Hash, Sparkles, Lock, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

interface ActiveRoom {
  id: string;
  admins: string[];
  isPrivate: boolean;
}

export default function Home() {
  const router = useRouter();
  const { setUserName, setRoomName, addAdmin, clearStore } = useMeetingStore();

  const [nameInput, setNameInput] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [entryStage, setEntryStage] = useState<'idle' | 'checking' | 'initializing'>('idle');

  useEffect(() => {
    const syncRooms = () => {
      const saved = localStorage.getItem('azura_active_meetings');
      if (saved) {
        const rooms: ActiveRoom[] = JSON.parse(saved);
        const uniqueRooms = rooms.reduce((acc: ActiveRoom[], current) => {
          const x = acc.find(item => item.id === current.id);
          if (!x && current.admins.length > 0) return acc.concat([current]);
          return acc;
        }, []);
        setActiveRooms(uniqueRooms);
      }
    };
    syncRooms();
    window.addEventListener('storage', syncRooms);
    return () => window.removeEventListener('storage', syncRooms);
  }, []);

  const processEntry = (roomId: string, roomAdmins: string[], roomIsPrivate: boolean, isNew: boolean) => {
    const finalRoomId = roomId.trim().replace(/\s+/g, '-').toLowerCase();
    if (!nameInput.trim()) {
      Swal.fire({
        title: 'WHO ARE YOU?',
        text: 'Please enter your name.',
        icon: 'question',
        confirmButtonColor: '#6366f1',
        customClass: { popup: 'rounded-[1.5rem] border-[4px] border-slate-900 shadow-[6px_6px_0_0_rgba(0,0,0,1)]' }
      });
      return;
    }
    if (!finalRoomId) return;

    setEntryStage('checking');
    setTimeout(() => {
      setEntryStage('initializing');
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => proceed(finalRoomId, roomAdmins, isNew), 600);
      }, 1000);
    }, 800);
  };

  const proceed = (roomId: string, currentAdmins: string[], isNew: boolean) => {
    clearStore();
    const saved = localStorage.getItem('azura_active_meetings');
    let allRooms: ActiveRoom[] = saved ? JSON.parse(saved) : [];
    if (isNew) {
      const existingIdx = allRooms.findIndex(r => r.id === roomId);
      if (existingIdx !== -1) {
        allRooms[existingIdx].admins = Array.from(new Set([...allRooms[existingIdx].admins, nameInput]));
      } else {
        allRooms.push({ id: roomId, admins: [nameInput], isPrivate });
      }
    }
    localStorage.setItem('azura_active_meetings', JSON.stringify(allRooms));
    setUserName(nameInput);
    setRoomName(roomId);
    addAdmin(nameInput);
    router.push(`/room/${roomId}`);
  };

  return (
    <main className={cn(
      "relative h-screen w-full flex items-center justify-center bg-[#FDFCF0] p-4 md:p-8 overflow-hidden transition-all duration-700",
      isExiting ? "opacity-0 scale-95 blur-md" : "opacity-100 scale-100 blur-0"
    )}>

      {/* OVERLAY LOADING */}
      {entryStage !== 'idle' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-xs w-full text-center space-y-6">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" strokeWidth={3} />
            <div className="space-y-1">
              <h2 className="text-white font-black text-xl uppercase italic tracking-tighter">
                {entryStage === 'checking' ? 'Security Check' : 'Initializing'}
              </h2>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                <div className={cn(
                  "h-full bg-indigo-500 transition-all duration-[1000ms] ease-out",
                  entryStage === 'initializing' ? "w-full" : "w-1/3"
                )} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Blurs */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-pink-100 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* Branding Section - Ukuran Font Diperkecil */}
        <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-indigo-600 font-bold text-[8px] uppercase tracking-[0.2em]">
            <Sparkles size={10} /> Powered by Azura AI
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.85]">
            Meet with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Confidence.</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-sm mx-auto lg:mx-0 font-medium italic opacity-80">
            "Next-gen conferencing. Private, fast, secure."
          </p>
        </div>

        {/* Card Form Section - Padding & Gap Dipangkas */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white rounded-[2.5rem] p-7 shadow-[10px_10px_0_0_rgba(15,23,42,1)] border-[3px] border-slate-900 space-y-6 relative">

            {/* Dekorasi Pojok */}
            <div className="absolute -top-1 -right-1 w-10 h-10 bg-indigo-50 rounded-bl-3xl border-b-[3px] border-l-[3px] border-slate-900" />

            {/* Input Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Your Identity</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Type your name..."
                className="w-full px-5 py-2.5 rounded-2xl bg-slate-50 border-[2px] border-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all font-black text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border-[2px] border-slate-900">
              <button
                onClick={() => setIsJoinMode(false)}
                className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", !isJoinMode ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                Create
              </button>
              <button
                onClick={() => setIsJoinMode(true)}
                className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all", isJoinMode ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}
              >
                Join
              </button>
            </div>

            <div className="min-h-[180px] flex flex-col justify-center">
              {!isJoinMode ? (
                <form onSubmit={(e) => { e.preventDefault(); processEntry(roomInput, [], isPrivate, true); }} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Room Name</label>
                    <input
                      type="text"
                      onChange={(e) => setRoomInput(e.target.value)}
                      placeholder="e.g. Marketing-Sync"
                      className="w-full px-5 py-2.5 rounded-2xl bg-slate-50 border-[2px] border-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-all font-black text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsPrivate(false)} className={cn("flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-[2px] font-black text-[9px] uppercase transition-all", !isPrivate ? "border-slate-900 bg-indigo-50 text-indigo-600" : "border-slate-100 text-slate-300")}>
                      <Globe size={14} /> Public
                    </button>
                    <button type="button" onClick={() => setIsPrivate(true)} className={cn("flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-[2px] font-black text-[9px] uppercase transition-all", isPrivate ? "border-slate-900 bg-pink-50 text-pink-600" : "border-slate-100 text-slate-300")}>
                      <Lock size={14} /> Private
                    </button>
                  </div>

                  <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_rgba(79,70,229,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 group mt-2">
                    Start Meeting <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar animate-in fade-in duration-300">
                  {activeRooms.length > 0 ? activeRooms.map((room, idx) => (
                    <button
                      key={`${room.id}-${idx}`}
                      onClick={() => processEntry(room.id, room.admins, room.isPrivate, false)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-[2px] border-slate-100 bg-white hover:border-slate-900 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg border-2 border-slate-900 flex items-center justify-center transition-colors", room.isPrivate ? "bg-pink-50 text-pink-500" : "bg-indigo-50 text-indigo-500")}>
                          {room.isPrivate ? <Lock size={16} /> : <Hash size={16} />}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-800 uppercase text-[11px] leading-tight">{room.id}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                            {room.admins.length} Hosts Online
                          </p>
                        </div>
                      </div>
                      <PlusCircle size={18} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  )) : (
                    <div className="py-10 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">No Active Rooms</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}