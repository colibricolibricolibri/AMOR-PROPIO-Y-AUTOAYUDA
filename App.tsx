import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Sparkles, 
  Volume2, 
  RefreshCw, 
  Camera, 
  Flower, 
  Image as ImageIcon,
  LayoutGrid
} from 'lucide-react';
import { ViewMode } from './types';
import { DAYS_CONTENT } from './data';

const SequentialPhrasesIcon = () => {
  const phrases = ['Lo siento', 'Perdóname', 'Te amo', 'Gracias'];
  const [index, setIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % phrases.length);
        setIsExiting(false);
      }, 600);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-transparent backdrop-blur-sm border-[2px] md:border-[3px] border-stone-200 rounded-full w-16 h-16 md:w-24 h-24 shadow-[5px_5px_15px_rgba(0,0,0,0.08)] float-animation relative overflow-hidden group">
      <div className="absolute inset-0 rounded-full border border-stone-50 pointer-events-none z-20"></div>
      <div className={`flex flex-col items-center justify-center transition-all duration-700 ease-in-out transform ${
        isExiting ? 'opacity-0 -translate-y-2 md:-translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}>
        <Sparkles className="text-[#880808] mb-0.5 md:mb-1 group-hover:scale-125 transition-transform duration-500" size={10} />
        <span className="text-[8px] md:text-[10px] font-black text-black uppercase tracking-[0.05em] md:tracking-[0.1em] text-center px-1 md:px-2 font-bree leading-tight select-none">
          {phrases[index]}
        </span>
      </div>
    </div>
  );
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const HOLIDAYS_2026: Record<number, number[]> = {
  0: [1], 1: [16, 17], 2: [24], 3: [2, 3], 4: [1], 5: [25], 6: [20], 8: [17], 9: [12], 10: [20], 11: [8, 25]
};

const LANDSCAPE_INTRO_IMG = "https://i.ibb.co/3mrwLdQM/intro.png";

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.INTRO);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0);
  const [alarmActive, setAlarmActive] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [dailyImages, setDailyImages] = useState<Record<number, string>>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const dailyFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDayNum, setUploadingDayNum] = useState<number | null>(null);

  const currentDay = DAYS_CONTENT[currentDayIndex];
  const currentDayNum = currentDayIndex + 1;
  
  const displayedImage = dailyImages[currentDayNum] || currentDay.image;
  const backgroundImage = (view === ViewMode.INTRO) ? LANDSCAPE_INTRO_IMG : (view === ViewMode.DAY_DETAIL ? (dailyImages[currentDayNum] || coverImage || currentDay.image) : coverImage);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) { console.warn("Audio no soportado"); }
  };

  useEffect(() => {
    const savedDay = localStorage.getItem('currentDayIndex');
    if (savedDay) setCurrentDayIndex(parseInt(savedDay));
    const savedCover = localStorage.getItem('coverImage');
    if (savedCover) setCoverImage(savedCover);
    const savedDailyImages = localStorage.getItem('dailyImages');
    if (savedDailyImages) { try { setDailyImages(JSON.parse(savedDailyImages)); } catch (e) { console.error("Error al cargar fotos:", e); } }
  }, []);

  useEffect(() => { localStorage.setItem('currentDayIndex', currentDayIndex.toString()); }, [currentDayIndex]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) setScrollProgress((window.scrollY / totalHeight) * 100);
    };
    if (view === ViewMode.DAY_DETAIL) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [view]);

  const saveImageToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } catch (e) { alert("⚠️ La imagen es demasiado pesada para guardar."); return false; }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCoverImage(base64);
        saveImageToStorage('coverImage', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDailyFileChange = (e: React.ChangeEvent<HTMLInputElement>, dayNum: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newImages = { ...dailyImages, [dayNum]: base64 };
        setDailyImages(newImages);
        saveImageToStorage('dailyImages', newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectDay = (dayIdx: number, monthIdx?: number) => {
    const newDayIdx = Math.max(0, Math.min(dayIdx, DAYS_CONTENT.length - 1));
    setCurrentDayIndex(newDayIdx);
    if (monthIdx !== undefined) setCurrentMonthIdx(monthIdx);
    setView(ViewMode.DAY_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const Header = () => (
    <header className="p-3 md:p-4 bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 flex justify-between items-center h-16 md:h-20 shadow-sm">
      {view === ViewMode.DAY_DETAIL && (
        <div className="absolute bottom-0 left-0 h-1 bg-[#880808] transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      )}
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView(ViewMode.INTRO)}>
        <Heart className="text-[#880808] fill-[#880808] w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />
        <div className="flex flex-col">
          <h1 className="text-sm md:text-lg font-black text-black leading-tight uppercase font-bree">Almanaque</h1>
          <span className="text-[7px] md:text-[9px] uppercase tracking-widest text-[#880808] font-bold">Amor Propio</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 md:gap-3">
        <button onClick={() => setView(ViewMode.GALLERY)} title="Mural Personal" className={`p-1.5 md:p-2 rounded-full border border-stone-200 transition-all ${view === ViewMode.GALLERY ? 'bg-[#ffcc00] border-black shadow-md scale-110' : 'bg-white hover:bg-stone-50'}`}>
          <LayoutGrid className="text-black w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
        </button>
        <button onClick={() => setView(ViewMode.CALENDAR)} title="Calendario" className={`p-1.5 md:p-2 rounded-full border border-stone-200 transition-all ${view === ViewMode.CALENDAR ? 'bg-black text-white border-black' : 'bg-white hover:bg-stone-50'}`}>
          <CalendarIcon className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
        </button>
        <button onClick={() => { setAlarmActive(!alarmActive); if(!alarmActive) { playChime(); alert("✨ Recordatorio activado."); } }} title="Activar Recordatorio" className={`p-1.5 md:p-2 rounded-full border border-stone-200 transition-all ${alarmActive ? 'bg-[#880808] text-white border-[#880808] shadow-inner' : 'bg-white hover:bg-stone-50'}`}>
          <Bell className={`${alarmActive ? 'animate-bounce' : ''} w-[16px] h-[16px] md:w-[20px] md:h-[20px]`} />
        </button>
      </div>
    </header>
  );

  const GalleryView = () => (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 md:space-y-12 pb-24 animate-fade-in font-bree relative z-10">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={() => setView(ViewMode.INTRO)} className="p-1.5 md:p-2 bg-black text-white rounded-full hover:bg-[#880808] transition-colors shadow-lg"><ChevronLeft className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" /></button>
        <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter">Mi Mural Personal</h2>
      </div>

      <section className="space-y-3 md:space-y-4">
        <h3 className="text-[10px] md:text-xs font-black uppercase text-black tracking-widest border-l-4 border-[#ffcc00] pl-3">Foto de Bienvenida</h3>
        <div className="h-48 sm:h-64 md:h-[600px] w-full border border-stone-200 shadow-xl overflow-hidden bg-transparent flex items-center justify-center relative group rounded-xl md:rounded-2xl transform transition-transform hover:scale-[1.005]">
          {coverImage ? (
            <img src={coverImage} className="w-full h-full object-contain" alt="Portada" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-stone-300">
              <ImageIcon className="w-[48px] h-[48px] md:w-[64px] md:h-[64px]" />
              <p className="font-bold text-[10px] md:text-sm uppercase tracking-widest text-center">Toca el botón para subir<br/>tu foto principal</p>
            </div>
          )}
          <button onClick={() => coverFileInputRef.current?.click()} className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-[#ffcc00] border-2 border-black p-3 md:p-5 rounded-full shadow-2xl hover:scale-110 transition-transform z-10"><Camera className="text-black w-[20px] h-[20px] md:w-[28px] md:h-[28px]" /></button>
        </div>
      </section>

      <section className="space-y-4 md:space-y-6">
        <h3 className="text-[10px] md:text-xs font-black uppercase text-black tracking-widest border-l-4 border-[#880808] pl-3">Fotos Diarias (1-31)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {Array.from({ length: 31 }).map((_, idx) => {
            const dayNum = idx + 1;
            const img = dailyImages[dayNum];
            return (
              <div key={dayNum} onClick={() => { setUploadingDayNum(dayNum); dailyFileInputRef.current?.click(); }}
                className="aspect-square border border-stone-200 shadow-sm bg-transparent overflow-hidden relative group cursor-pointer hover:scale-[1.05] hover:shadow-lg transition-all rounded-lg md:rounded-xl"
              >
                {img ? (
                  <img src={img} className="w-full h-full object-cover" alt={`Día ${dayNum}`} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 md:gap-2 opacity-30">
                    <Camera className="text-black w-[18px] h-[18px] md:w-[24px] md:h-[24px]" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase">Subir</span>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-black/70 text-white text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 font-black rounded backdrop-blur-md shadow-lg">{dayNum}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const IntroView = () => (
    <div className="relative min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] z-10 flex flex-col items-center justify-center p-4 md:p-12 animate-fade-in font-bree">
      <div className="absolute inset-0 z-0 overflow-hidden">
         <img src={LANDSCAPE_INTRO_IMG} className="w-full h-full object-cover" alt="Inicio" />
         <div className="absolute inset-0 bg-black/15" /> 
      </div>

      <div className="relative z-10 text-center space-y-6 md:space-y-8 max-w-5xl w-full">
        <div className="flex justify-center mb-1 md:mb-2">
          <div className="bg-white/95 p-3 md:p-5 rounded-full border border-stone-200 shadow-2xl backdrop-blur-md float-animation">
            <Heart className="text-[#880808] fill-[#880808] w-8 h-8 md:w-12 md:h-12" />
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl md:text-6xl font-black leading-tight uppercase tracking-tighter drop-shadow-lg px-2 yellow-outlined">
          Camino de Transformación
        </h2>

        <div className="bg-transparent p-5 md:p-12 border border-stone-200 shadow-2xl relative overflow-hidden transform md:-rotate-1 group rounded-[1.5rem] md:rounded-[2.5rem] transition-all hover:rotate-0">
          <div className="space-y-4 md:space-y-6 text-left text-black leading-relaxed text-base sm:text-lg md:text-2xl">
            <p className="font-black text-[#880808] italic text-lg sm:text-xl md:text-3xl border-l-4 md:border-l-8 border-[#880808] pl-4 md:pl-6">"Este es un borrador de 21 días, basado en mi propia experiencia."</p>
            <p className="font-semibold text-stone-800 text-sm sm:text-base md:text-xl">Existe un lugar en donde llega la calma y reina el amor puro. Y ese lugar no está ahí afuera, sino en tu interior.</p>
            <p className="font-semibold text-stone-800 text-sm sm:text-base md:text-xl">Sí, dentro tuyo está ese lugar, de calma, de paz, de sanación. Sanando tu interior vas a poder encontrar ese hermoso lugar.</p>
            
            <div className="pt-4 md:pt-6 border-t border-stone-100 space-y-3 md:space-y-4">
              <p className="font-bold text-stone-400 text-[9px] md:text-[11px] uppercase tracking-widest italic">Parte del contenido lo obtuve en internet por lo que no tengo derecho de autor de esa parte.</p>
              <div className="flex flex-col gap-1 md:gap-2">
                <span className="text-base sm:text-lg md:text-2xl font-black uppercase tracking-tighter">Hoy deseo desde mi</span>
                <span className="text-3xl sm:text-4xl md:text-8xl font-black text-[#880808] leading-none uppercase tracking-tighter py-4">YO SOY YO</span>
                <span className="text-base sm:text-lg md:text-2xl font-bold italic text-[#880808]">ayudar en tu camino de transformación</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-8 bg-[#ffcc00]/10 text-stone-900 p-4 md:p-6 border-2 border-[#ffcc00] shadow-sm rounded-xl md:rounded-2xl">
               <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#880808] uppercase tracking-tighter mb-1 text-center">Yo Soy yo:</p>
               <p className="text-sm sm:text-base md:text-xl font-bold uppercase tracking-widest leading-snug text-center">Completo, presente, vivo en mi poder</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-4 md:pt-8">
          <button onClick={() => setView(ViewMode.CALENDAR)} className="group px-8 md:px-12 py-4 md:py-6 bg-[#ffcc00] text-black font-black text-xl md:text-3xl shadow-[0_4px_0_0_rgba(0,0,0,1)] md:shadow-[0_8px_0_0_rgba(0,0,0,1)] hover:bg-black hover:text-[#ffcc00] transition-all transform hover:-translate-y-1 uppercase tracking-[0.1em] border-2 border-black active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 md:gap-4 rounded-xl md:rounded-2xl">
            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />
            <span className="yellow-outlined">Entrar</span>
          </button>
          <button onClick={() => setView(ViewMode.GALLERY)} className="px-8 md:px-12 py-4 md:py-6 bg-white border border-stone-200 font-black uppercase tracking-widest text-base md:text-xl flex items-center justify-center gap-4 md:gap-6 shadow-md hover:bg-stone-50 transition-all transform hover:-translate-y-1 rounded-xl md:rounded-2xl">
            <LayoutGrid className="w-6 h-6 md:w-8 md:h-8" /> Mural
          </button>
        </div>
      </div>
    </div>
  );

  const CalendarView = () => (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 md:space-y-12 pb-24 animate-fade-in font-bree relative z-10">
      <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-10">
        <button onClick={() => setView(ViewMode.INTRO)} className="p-2 md:p-3 bg-black text-white rounded-full shadow-lg hover:scale-110 transition-transform"><ChevronLeft className="w-[20px] h-[20px] md:w-[24px] md:h-[24px]" /></button>
        <div className="flex flex-col">
          <h2 className="text-xl md:text-3xl font-black text-black uppercase tracking-tighter">Calendario 2026</h2>
          <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.4em] text-[#880808]">Feriados Argentina en rojo</span>
        </div>
      </div>
      
      <div className="space-y-12 md:space-y-20">
        {MONTH_NAMES.map((month, mIdx) => {
          const daysInMonth = (mIdx === 1) ? 28 : ([3, 5, 8, 10].includes(mIdx) ? 30 : 31);
          return (
            <div key={month} className="space-y-4 md:space-y-8 border-l-[4px] md:border-l-[6px] border-[#ffcc00] pl-4 md:pl-8 scroll-reveal">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2 md:pb-4 bg-transparent p-3 md:p-5 shadow-sm rounded-tr-[1.5rem] md:rounded-tr-[2rem]">
                <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-black uppercase italic tracking-tighter">{month}</h3>
                <Sparkles className="text-[#ffcc00] animate-pulse w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-3 md:gap-6">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-center text-[8px] md:text-[12px] font-black py-1 md:py-2 uppercase opacity-40">{d}</div>)}
                {Array.from({ length: daysInMonth }).map((_, dIdx) => {
                  const dayNum = dIdx + 1;
                  const photo = dailyImages[dayNum];
                  const isHoliday = HOLIDAYS_2026[mIdx]?.includes(dayNum);
                  return (
                    <button key={dIdx} onClick={() => dIdx < DAYS_CONTENT.length && selectDay(dIdx, mIdx)} 
                      className={`aspect-square border flex flex-col items-center justify-center transition-all overflow-hidden relative shadow-sm rounded-lg md:rounded-2xl ${dIdx < DAYS_CONTENT.length ? 'bg-transparent border-stone-100 hover:bg-[#ffcc00]/20 hover:border-[#ffcc00] hover:scale-110 z-10 hover:shadow-xl' : 'bg-stone-50 opacity-10'}`}
                    >
                      {photo && <img src={photo} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />}
                      <span className={`text-sm sm:text-xl md:text-3xl font-black relative z-10 ${isHoliday ? 'text-[#880808]' : 'text-black'}`}>{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const DayDetailView = () => {
    const mantraText = "lo siento, perdóname, te amo, gracias ";
    const highlightedDays = [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27];
    
    return (
      <div className="max-w-screen-xl mx-auto p-3 md:p-8 space-y-8 md:space-y-12 pb-48 animate-fade-in relative font-bree z-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 max-w-5xl mx-auto">
          <button onClick={() => setView(ViewMode.CALENDAR)} className="w-full sm:w-auto flex items-center justify-center gap-2 text-black bg-white px-4 md:px-6 py-2 md:py-3 border border-stone-200 font-black uppercase text-[10px] md:text-xs shadow-sm hover:translate-y-0.5 transition-all rounded-xl md:rounded-2xl"><ChevronLeft className="w-[18px] h-[18px] md:w-[22px] md:h-[22px]" />Calendario</button>
          <div className="w-full sm:w-auto text-center text-white bg-[#880808] font-black uppercase text-[10px] md:text-xs px-4 md:px-6 py-2 md:py-3 shadow-md tracking-widest rounded-xl md:rounded-2xl">{MONTH_NAMES[currentMonthIdx]} · Día {currentDayNum}</div>
        </div>
        
        <div className="relative scroll-reveal max-w-6xl mx-auto">
          <div className="absolute -top-10 -right-2 md:-top-14 md:-right-4 z-30 scale-100 md:scale-125"><SequentialPhrasesIcon /></div>
          <div className="overflow-hidden min-h-[40vh] sm:min-h-[60vh] md:h-[85vh] shadow-2xl border-[6px] md:border-[10px] border-white relative group bg-transparent rounded-[2rem] md:rounded-[4rem] transform transition-all duration-1000">
            <img src={displayedImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[20000ms]" alt={currentDay.title} onError={(e) => { (e.target as any).src = currentDay.image; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-8 left-8 right-8 md:bottom-16 md:left-16 md:right-16 flex flex-col gap-4 md:gap-8 items-center">
               <h2 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-tighter leading-tight drop-shadow-lg yellow-outlined text-center">{currentDay.title}</h2>
               <button onClick={() => { setUploadingDayNum(currentDayNum); dailyFileInputRef.current?.click(); }} 
                  className="mt-6 bg-[#ffcc00] text-black px-6 md:px-12 py-3 md:py-5 border-2 border-black flex items-center justify-center gap-3 md:gap-5 text-[10px] md:text-sm uppercase font-black w-fit shadow-xl hover:scale-105 active:scale-95 transition-all rounded-full"
               >
                 <Camera className="w-[20px] h-[20px] md:w-[30px] md:h-[30px]" /> <span className="yellow-outlined">Cambiar Foto</span>
               </button>
            </div>
          </div>
        </div>

        <div className="space-y-12 md:space-y-20 max-w-5xl mx-auto">
          <div className="bg-transparent p-6 sm:p-12 md:p-24 border border-stone-100 shadow-xl text-lg sm:text-2xl md:text-4xl leading-relaxed relative font-medium italic rounded-[2rem] md:rounded-[3rem]">
            <div className="absolute -top-4 md:-top-7 left-8 md:left-16 bg-[#ffcc00] text-black h-8 md:h-14 w-48 md:w-80 border-2 border-black text-[7px] md:text-xs font-black uppercase z-10 shadow-lg overflow-hidden flex items-center rounded-lg">
              <div className="animate-marquee whitespace-nowrap">
                <span className="px-2 md:px-4 tracking-[0.1em] md:tracking-[0.2em] yellow-outlined">{mantraText}</span>
                <span className="px-2 md:px-4 tracking-[0.1em] md:tracking-[0.2em] yellow-outlined">{mantraText}</span>
              </div>
            </div>
            {currentDay.content.map((p, i) => {
              if (highlightedDays.includes(currentDayNum) && i === 0) {
                return (
                  <div key={i} className="mb-8 md:mb-16 p-6 sm:p-12 md:p-20 bg-transparent border-[3px] md:border-[6px] border-[#ffcc00] shadow-md transform md:-rotate-1 rounded-2xl md:rounded-3xl relative overflow-hidden">
                    <p className="text-3xl sm:text-5xl md:text-8xl font-black uppercase text-[#880808] m-0 leading-none tracking-tighter text-center">{p}</p>
                  </div>
                );
              }
              if (currentDayNum === 31 && i === 0) {
                const highlightDay31 = (text: string) => {
                  let result: React.ReactNode[] = [text];
                  const keywords = ["Me libero.", "Me ordeno.", "Me vuelvo a elegir.", "mi energía recupera su trono"];
                  keywords.forEach(keyword => {
                    const newResult: React.ReactNode[] = [];
                    result.forEach(part => {
                      if (typeof part === 'string') {
                        const chunks = part.split(keyword);
                        chunks.forEach((chunk, idx) => {
                          newResult.push(chunk);
                          if (idx < chunks.length - 1) {
                            newResult.push(<span key={idx} className="text-[#880808] font-black uppercase tracking-tighter">{keyword}</span>);
                          }
                        });
                      } else { newResult.push(part); }
                    });
                    result = newResult;
                  });
                  return result;
                };
                return (
                  <div key={i} className="mb-6 md:mb-12 p-6 md:p-16 bg-transparent border-[3px] md:border-[6px] border-[#ffcc00] shadow-lg transform md:-rotate-1 rounded-[2rem] md:rounded-[4rem] relative overflow-hidden">
                    <p className="text-base sm:text-xl md:text-3xl font-medium text-center leading-relaxed text-stone-900 whitespace-pre-line relative z-10">
                      {highlightDay31(p)}
                    </p>
                  </div>
                );
              }
              return (
                <div key={i} className="contents">
                  <p className="capitular mb-8 md:mb-12 last:mb-0 first-letter:text-5xl md:first-letter:text-9xl first-letter:font-black first-letter:mr-2 md:first-letter:mr-6 first-letter:float-left leading-tight whitespace-pre-line text-stone-800 text-sm sm:text-lg md:text-2xl">
                    {p}
                  </p>
                  {currentDayNum === 13 && i === currentDay.content.length - 1 && (
                    <div className="mt-8 md:mt-16 mb-8 md:mb-12 p-6 sm:p-10 md:p-16 bg-transparent border-[3px] md:border-[6px] border-[#ffcc00] shadow-2xl rounded-[2rem] md:rounded-[3rem] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 animate-pulse pointer-events-none">
                        <Flower className="text-[#880808] w-[80px] h-[80px] md:w-[120px] md:h-[120px]" />
                      </div>
                      <h4 className="text-xl md:text-4xl font-black text-[#880808] uppercase tracking-tighter mb-4 md:mb-8 border-b-2 md:border-b-4 border-[#ffcc00] pb-2 md:pb-4 w-fit">
                        Tips de meditación para ti
                      </h4>
                      <div className="space-y-4 md:space-y-6 text-sm sm:text-lg md:text-2xl font-medium text-stone-800 leading-relaxed italic">
                        <p>Respira sintiendo cómo entra el aire por tu nariz y llévalo hasta tu estómago.</p>
                        <p>Para saber si lo haces bien, apoya tu mano sobre él; debes sentir cómo se infla. Cuenta hasta 4 y lleva el aire hacia tu pecho. Se inflará el pecho y tu panza quedará chata. Vuelve a contar, esta vez hasta 10, y exhala por la nariz sintiendo la salida del aire.</p>
                        <p>Mientras haces esto, concéntrate solo en tu respiración y el aire moviéndose dentro; esto vaciará tus pensamientos. Meditar es eso: vaciar la cabeza.</p>
                        <p className="font-bold text-[#880808] not-italic mt-4 md:mt-8 pt-4 md:pt-6 border-t border-stone-100">Puedes hacer esto 3 veces e ir aumentando cada día hasta llegar a los 10 minutos.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="bg-transparent p-8 sm:p-16 md:p-24 border border-stone-100 shadow-2xl relative overflow-hidden group rounded-[3rem] md:rounded-[5rem]">
            <div className="absolute top-0 right-0 p-6 md:p-12 opacity-5 animate-pulse pointer-events-none"><Flower className="text-[#880808] w-[150px] h-[150px] md:w-[300px] md:h-[300px]" /></div>
            <div className="relative z-10 text-stone-900">
              <div className="flex items-center gap-4 md:gap-10 mb-6 md:mb-12 justify-center">
                <RefreshCw className="text-[#ffcc00] animate-spin-slow w-8 h-8 md:w-16 md:h-16" />
                <h3 className="text-xs sm:text-lg font-black uppercase tracking-[0.3em] md:tracking-[0.7em] text-[#880808]">Mantra Transformador</h3>
              </div>
              <div className="relative py-8 md:py-16 text-center overflow-hidden">
                 <p className="text-lg sm:text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter drop-shadow-sm yellow-outlined leading-tight">
                   "{currentDay.mantra}"
                 </p>
              </div>
              {currentDay.mantraDescription && (
                <p className="text-stone-700 text-base sm:text-3xl md:text-4xl italic border-l-[8px] md:border-l-[15px] border-[#ffcc00] pl-6 md:pl-16 leading-relaxed font-bold whitespace-pre-line mt-8 md:mt-12">
                  {currentDay.mantraDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-10 pt-8 md:pt-16 pb-36 max-w-5xl mx-auto">
          <button onClick={() => selectDay(currentDayIndex - 1)} disabled={currentDayIndex === 0} className="flex-1 py-8 md:py-14 bg-white border border-stone-200 text-black font-black flex items-center justify-center gap-3 md:gap-6 text-2xl md:text-5xl disabled:opacity-20 uppercase tracking-widest hover:bg-stone-50 transition-all shadow-md rounded-[1.5rem] md:rounded-[2rem]"><ChevronLeft className="w-[30px] h-[30px] md:w-[60px] md:h-[60px]" /> Atrás</button>
          
          <button 
            onClick={() => selectDay(currentDayIndex + 1)} 
            disabled={currentDayIndex === DAYS_CONTENT.length - 1} 
            className="flex-1 py-8 md:py-14 bg-[#ffcc00] text-black font-black border-2 border-black flex flex-col items-center justify-center gap-2 md:gap-4 text-2xl md:text-5xl disabled:opacity-20 uppercase tracking-widest shadow-xl rounded-[1.5rem] md:rounded-[2rem] relative overflow-hidden"
          >
            <div className="w-full flex items-center justify-center relative yellow-outlined">
              <span className="text-center">Siguiente</span>
              <ChevronRight className="absolute right-4 md:right-8 w-[30px] h-[30px] md:w-[60px] md:h-[60px]" />
            </div>
            
            <div className="bg-black text-[#ffcc00] border border-black rounded-lg px-2 md:px-4 py-0.5 md:py-1.5 overflow-hidden w-32 md:w-56 h-5 md:h-8 flex items-center shadow-inner mt-4">
              <div className="animate-marquee whitespace-nowrap text-[8px] md:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.15em] yellow-outlined">
                <span>Limpia, limpia, limpia &nbsp;&nbsp;&nbsp;</span>
                <span>Limpia, limpia, limpia &nbsp;&nbsp;&nbsp;</span>
              </div>
            </div>
          </button>
        </div>
        
        <div className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 md:gap-6 z-50 w-full px-4 md:px-12 max-w-3xl">
          <button onClick={() => { if(alarmActive) playChime(); alert("✨ PRÁCTICA DE HO'OPONOPONO:\n\nRepite el mantra 3 veces.\n\nEl cambio comienza en tu interior."); }} 
            className="bg-transparent backdrop-blur-md text-[#880808] px-6 md:px-14 py-6 md:py-12 shadow-[0_15px_50px_rgba(0,0,0,0.15)] font-black flex items-center gap-4 md:gap-12 border-2 border-stone-100 w-full justify-center transform hover:scale-105 active:scale-95 transition-transform rounded-full"
          >
            <Volume2 className="text-[#ffcc00] w-12 h-12 md:w-20 md:h-20" />
            <div className="flex flex-col items-start">
              <span className="tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-[14px] text-stone-400 leading-none">cuando sientas malestar</span>
              <span className="text-xl md:text-4xl leading-none mt-1 md:mt-4 font-black">repite la frase 3 veces</span>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 selection:bg-[#ffcc00] selection:text-black relative overflow-x-hidden">
      {view !== ViewMode.INTRO && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {backgroundImage && (
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2500ms] animate-fade-in" style={{ backgroundImage: `url(${backgroundImage})` }}>
              <div className="absolute inset-0 bg-stone-50/85 backdrop-blur-[20px]" />
            </div>
          )}
        </div>
      )}
      <Header />
      <main className="container mx-auto max-w-screen-2xl relative z-10">
        {view === ViewMode.INTRO && <IntroView />}
        {view === ViewMode.CALENDAR && <CalendarView />}
        {view === ViewMode.DAY_DETAIL && <DayDetailView />}
        {view === ViewMode.GALLERY && <GalleryView />}
      </main>
      <footer className="mt-16 md:mt-32 text-center text-black p-12 md:p-24 border-t border-stone-100 bg-white/95 flex flex-col items-center gap-6 md:gap-12 font-bree relative z-10">
        <div className="flex items-center gap-6 md:gap-16">
          <Heart className="text-[#880808] fill-[#880808] w-[32px] h-[32px] md:w-[64px] md:h-[64px]" />
          <Flower className="text-[#ffcc00] animate-spin-slow w-[40px] h-[40px] md:w-[80px] md:h-[80px]" />
          <Heart className="text-[#880808] fill-[#880808] w-[32px] h-[32px] md:w-[64px] md:h-[64px]" />
        </div>
        <div className="space-y-3 md:space-y-6">
          <p className="font-black uppercase tracking-[0.3em] md:tracking-[0.7em] text-lg md:text-3xl text-[#880808]">Almanaque de Amor Propio</p>
          <p className="text-[10px] md:text-[14px] font-bold opacity-30 uppercase tracking-[0.3em] md:tracking-[0.5em]">Elizabeth · 2026 · Transformación Interior</p>
        </div>
      </footer>
      <input type="file" ref={coverFileInputRef} onChange={handleCoverFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={dailyFileInputRef} onChange={(e) => uploadingDayNum !== null && handleDailyFileChange(e, uploadingDayNum)} accept="image/*" className="hidden" />
    </div>
  );
};

export default App;