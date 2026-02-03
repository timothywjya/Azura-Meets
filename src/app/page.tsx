"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMeetingStore } from '@/store/useMeetingStore';
import { PlusCircle, ArrowRight, Hash, Sparkles, Lock, Globe, ShieldCheck } from 'lucide-react';
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

  // 1. Sinkronisasi Room yang sedang Aktif (Hanya yang punya Admin)
  useEffect(() => {
    const syncRooms = () => {
      const saved = localStorage.getItem('azura_active_meetings');
      if (saved) {
        const rooms: ActiveRoom[] = JSON.parse(saved);
        // Filter: Hanya tampilkan room yang masih memiliki admin aktif
        setActiveRooms(rooms.filter(r => r.admins.length > 0));
      }
    };

    syncRooms();
    // Dengarkan perubahan dari tab lain (jika admin di tab lain menutup meeting)
    window.addEventListener('storage', syncRooms);
    return () => window.removeEventListener('storage', syncRooms);
  }, []);

  // 2. Logic Validasi & Masuk ke Room
  const processEntry = (roomId: string, roomAdmins: string[], roomIsPrivate: boolean, isNew: boolean) => {
    const finalRoomId = roomId.trim().replace(/\s+/g, '-').toLowerCase();

    if (!nameInput.trim()) {
      Swal.fire({
        title: 'Identity Required',
        text: 'Please enter your name first. 😊',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    // Jika Room Private & User bukan Admin pertama (Joiner)
    if (roomIsPrivate && !isNew) {
      Swal.fire({
        title: 'Private Meeting',
        text: 'Azura.AI is asking for host approval...',
        icon: 'info',
        showConfirmButton: false,
        timer: 2000,
        didOpen: () => Swal.showLoading(),
      }).then(() => proceed(finalRoomId, roomAdmins, isNew));
    } else {
      proceed(finalRoomId, roomAdmins, isNew);
    }
  };

  const proceed = (roomId: string, currentAdmins: string[], isNew: boolean) => {
    clearStore(); // Bersihkan data lama

    // Update LocalStorage: Tambahkan user sebagai Admin jika slot < 3
    const saved = localStorage.getItem('azura_active_meetings');
    let allRooms: ActiveRoom[] = saved ? JSON.parse(saved) : [];

    if (isNew) {
      allRooms.push({ id: roomId, admins: [nameInput], isPrivate });
    } else {
      const idx = allRooms.findIndex(r => r.id === roomId);
      if (idx !== -1 && allRooms[idx].admins.length < 3 && !allRooms[idx].admins.includes(nameInput)) {
        allRooms[idx].admins.push(nameInput);
      }
    }

    localStorage.setItem('azura_active_meetings', JSON.stringify(allRooms));

    // Set Zustand Store
    setUserName(nameInput);
    setRoomName(roomId);
    addAdmin(nameInput);

    router.push(`/room/${roomId}`);
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#F9FBFF] p-4 md:p-12 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60">
        <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-pastel-blue rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[350px] h-[350px] bg-pastel-pink rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left Side: Branding */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-slate-100 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <Sparkles size={14} className="animate-pulse" /> Azura.AI Assistant
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 leading-[1.1]">
            Experience <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Pure Privacy.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-md mx-auto lg:mx-0 leading-relaxed">
            Multi-host secure meetings with automated chat logs and self-destructing rooms.
          </p>
        </div>

        {/* Right Side: Card Form */}
        <div className="lg:col-span-5 w-full animate-slide-up">
          <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white shadow-2xl space-y-6">

            {/* Field Nama */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Display Name</label>
              <input
                type="text"
                placeholder="Ex: Timothy Wijaya"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-300 focus:bg-white outline-none transition-all text-slate-700 font-medium"
                onChange={(e) => setNameInput(e.target.value)}
              />
            </div>

            {/* Switcher Mode */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setIsJoinMode(false)}
                className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", !isJoinMode ? "bg-white shadow-md text-indigo-600" : "text-slate-500")}
              >
                Create Room
              </button>
              <button
                onClick={() => setIsJoinMode(true)}
                className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all", isJoinMode ? "bg-white shadow-md text-indigo-600" : "text-slate-500")}
              >
                Join Meeting
              </button>
            </div>

            <div className="min-h-[300px]">
              {!isJoinMode ? (
                <form onSubmit={(e) => { e.preventDefault(); processEntry(roomInput, [], isPrivate, true); }} className="space-y-5 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Room Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Design-Sync"
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:border-indigo-300 focus:bg-white outline-none transition-all text-slate-700"
                      onChange={(e) => setRoomInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setIsPrivate(false)} className={cn("flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-[10px] font-bold uppercase", !isPrivate ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-50 text-slate-400")}>
                      <Globe size={14} /> Public
                    </button>
                    <button type="button" onClick={() => setIsPrivate(true)} className={cn("flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-[10px] font-bold uppercase", isPrivate ? "border-pink-500 bg-pink-50 text-pink-600" : "border-slate-50 text-slate-400")}>
                      <Lock size={14} /> Private
                    </button>
                  </div>

                  <button type="submit" className="w-full py-5 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-3">
                    Launch Meeting <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                <div className="space-y-3 animate-fade-in max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeRooms.length > 0 ? activeRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => processEntry(room.id, room.admins, room.isPrivate, false)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-300 hover:shadow-lg transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", room.isPrivate ? "bg-pink-50 text-pink-500" : "bg-indigo-50 text-indigo-500")}>
                          {room.isPrivate ? <Lock size={18} /> : <Hash size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 leading-none mb-1">{room.id}</p>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={10} className="text-indigo-400" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              Hosts: {room.admins.length}/3
                            </p>
                          </div>
                        </div>
                      </div>
                      <PlusCircle size={20} className="text-slate-200 group-hover:text-indigo-500" />
                    </button>
                  )) : (
                    <div className="text-center py-10 text-slate-400 text-sm italic bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                      No live meetings found.
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