"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/useMeetingStore';
import { PlusCircle, ArrowRight, Hash, Sparkles, Lock, Globe, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

// Interface untuk struktur data Room di LocalStorage
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

  // 1. Sinkronisasi & Pembersihan Duplikat
  useEffect(() => {
    const syncRooms = () => {
      const saved = localStorage.getItem('azura_active_meetings');
      if (saved) {
        const rooms: ActiveRoom[] = JSON.parse(saved);

        // FILTER & UNIQUE: Memastikan tidak ada ID ganda dan hanya room dengan admin yang tampil
        const uniqueRooms = rooms.reduce((acc: ActiveRoom[], current) => {
          const x = acc.find(item => item.id === current.id);
          if (!x && current.admins.length > 0) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        // Update storage jika kita menemukan dan membersihkan duplikat
        if (uniqueRooms.length !== rooms.length) {
          localStorage.setItem('azura_active_meetings', JSON.stringify(uniqueRooms));
        }

        setActiveRooms(uniqueRooms);
      }
    };

    syncRooms();
    window.addEventListener('storage', syncRooms);
    return () => window.removeEventListener('storage', syncRooms);
  }, []);

  // 2. Logic Validasi & Masuk ke Room
  const processEntry = (roomId: string, roomAdmins: string[], roomIsPrivate: boolean, isNew: boolean) => {
    // Normalisasi ID: Huruf kecil, ganti spasi dengan dash
    const finalRoomId = roomId.trim().replace(/\s+/g, '-').toLowerCase();

    if (!nameInput.trim()) {
      Swal.fire({
        title: 'Who are you?',
        text: 'Please enter your name to continue.',
        icon: 'question',
        confirmButtonColor: '#6366f1',
        customClass: { popup: 'rounded-[2rem]' }
      });
      return;
    }

    if (!finalRoomId) return;

    if (roomIsPrivate && !isNew) {
      Swal.fire({
        title: 'Requesting Access',
        text: 'Waiting for Azura.AI security check...',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      }).then(() => proceed(finalRoomId, roomAdmins, isNew));
    } else {
      proceed(finalRoomId, roomAdmins, isNew);
    }
  };

  const proceed = (roomId: string, currentAdmins: string[], isNew: boolean) => {
    clearStore();

    const saved = localStorage.getItem('azura_active_meetings');
    let allRooms: ActiveRoom[] = saved ? JSON.parse(saved) : [];

    if (isNew) {
      // Pastikan tidak menimpa room yang sudah ada dengan ID yang sama
      const existingIdx = allRooms.findIndex(r => r.id === roomId);
      if (existingIdx !== -1) {
        allRooms[existingIdx].admins = Array.from(new Set([...allRooms[existingIdx].admins, nameInput]));
      } else {
        allRooms.push({ id: roomId, admins: [nameInput], isPrivate });
      }
    } else {
      const idx = allRooms.findIndex(r => r.id === roomId);
      if (idx !== -1) {
        if (!allRooms[idx].admins.includes(nameInput)) {
          allRooms[idx].admins.push(nameInput);
        }
      }
    }

    localStorage.setItem('azura_active_meetings', JSON.stringify(allRooms));

    setUserName(nameInput);
    setRoomName(roomId);
    addAdmin(nameInput);

    router.push(`/room/${roomId}`);
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#FDFCF0] p-4 md:p-12 overflow-hidden">

      {/* Soft Background Blur */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-100/50 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

        {/* Branding Section */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white shadow-sm border border-slate-100 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em]">
            <Sparkles size={14} /> Powered by Azura Intelligence
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            Meet with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Confidence.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-md mx-auto lg:mx-0 font-medium">
            The next generation of video conferencing. Private, fast, and secure.
          </p>
        </div>

        {/* Card Form Section */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white space-y-8">

            {/* Display Name Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Your Identity</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="What's your name?"
                className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
              />
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-2 rounded-[2rem]">
              <button
                onClick={() => setIsJoinMode(false)}
                className={cn("flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase transition-all", !isJoinMode ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}
              >
                Create
              </button>
              <button
                onClick={() => setIsJoinMode(true)}
                className={cn("flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase transition-all", isJoinMode ? "bg-white shadow-sm text-indigo-600" : "text-slate-400")}
              >
                Join
              </button>
            </div>

            <div className="min-h-[280px]">
              {!isJoinMode ? (
                <form onSubmit={(e) => { e.preventDefault(); processEntry(roomInput, [], isPrivate, true); }} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Room Name</label>
                    <input
                      type="text"
                      onChange={(e) => setRoomInput(e.target.value)}
                      placeholder="e.g. Weekly-Standup"
                      className="w-full px-8 py-5 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsPrivate(false)} className={cn("flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all", !isPrivate ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 text-slate-300")}>
                      <Globe size={16} /> Public
                    </button>
                    <button type="button" onClick={() => setIsPrivate(true)} className={cn("flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all", isPrivate ? "border-pink-500 bg-pink-50 text-pink-600" : "border-slate-100 text-slate-300")}>
                      <Lock size={16} /> Private
                    </button>
                  </div>

                  <button type="submit" className="w-full py-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 group">
                    Start Meeting <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </form>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in">
                  {activeRooms.length > 0 ? activeRooms.map((room, idx) => (
                    <button
                      // UNIK: Menggunakan kombinasi ID dan Index untuk key
                      key={`${room.id}-${idx}`}
                      onClick={() => processEntry(room.id, room.admins, room.isPrivate, false)}
                      className="w-full flex items-center justify-between p-5 rounded-[2rem] border-2 border-slate-50 bg-white hover:border-indigo-500 hover:shadow-xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", room.isPrivate ? "bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white" : "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white")}>
                          {room.isPrivate ? <Lock size={20} /> : <Hash size={20} />}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-800 uppercase text-sm leading-tight">{room.id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck size={12} className="text-indigo-400" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              {room.admins.length} Hosts Active
                            </p>
                          </div>
                        </div>
                      </div>
                      <PlusCircle size={24} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <Globe size={20} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">No Live Meetings</p>
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