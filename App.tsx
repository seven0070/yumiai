import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppMode, SystemStats } from './types';
import ChatInterface from './components/ChatInterface';
import LiveInterface from './components/LiveInterface';
import { MessageSquare, Zap, Activity, Wifi, Video, Mic } from 'lucide-react';

// --- Background Particle Component ---
const ParticleBackground: React.FC<{ mode: AppMode }> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{x: number, y: number, vx: number, vy: number, size: number, alpha: number}>>([]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Initialize particles
    const particleCount = window.innerWidth < 768 ? 30 : 60;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isLive = mode === AppMode.LIVE;
      const baseColor = isLive ? '232, 121, 249' : '34, 211, 238'; // Fuchsia vs Cyan
      const speedMultiplier = isLive ? 2.5 : 0.8;
      
      // Update and draw particles
      particlesRef.current.forEach((p, i) => {
        // Movement
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle (Square for tech feel)
        ctx.fillStyle = `rgba(${baseColor}, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);

        // Connections
        particlesRef.current.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150;

          if (distance < maxDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${baseColor}, ${(1 - distance / maxDist) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60" />;
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LIVE);
  const [stats, setStats] = useState<SystemStats>({
    latency: 0,
    videoStatus: 'OFFLINE',
    audioQuality: 'N/A'
  });

  // In a real scenario, we might prompt for this if not in env, 
  // but requirements state strict usage of process.env.API_KEY
  const apiKey = process.env.API_KEY || ''; 

  const handleStatsUpdate = useCallback((newStats: Partial<SystemStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  }, []);

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono">
        FATAL ERROR: API_KEY NOT DETECTED IN ENVIRONMENT
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-50 flex flex-col md:flex-row overflow-hidden relative selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
      
      {/* Dynamic Styles for Background Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
      `}</style>

      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-all duration-1000">
        {/* Particle System Layer */}
        <ParticleBackground mode={mode} />

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>
        
        {/* Dynamic Blobs */}
        {/* Blob 1: Top Left */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-30 animate-blob transition-colors duration-1000 ease-in-out mix-blend-screen ${
           mode === AppMode.CHAT ? 'bg-purple-900' : 'bg-fuchsia-900'
        }`}></div>
        
        {/* Blob 2: Bottom Right */}
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-30 animate-blob animation-delay-2000 transition-colors duration-1000 ease-in-out mix-blend-screen ${
           mode === AppMode.CHAT ? 'bg-cyan-900' : 'bg-rose-900'
        }`}></div>
        
        {/* Blob 3: Center/Floating */}
        <div className={`absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full blur-[100px] opacity-20 animate-blob animation-delay-4000 transition-colors duration-1000 ease-in-out mix-blend-screen ${
           mode === AppMode.CHAT ? 'bg-blue-900' : 'bg-amber-900'
        }`}></div>

        {/* Live Mode Specific Effects */}
        {mode === AppMode.LIVE && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[200%] w-full animate-scanline pointer-events-none"></div>
        )}
      </div>

      {/* Sidebar / Navigation */}
      <div className="w-full md:w-20 md:h-screen border-b md:border-b-0 md:border-r border-cyan-900/30 bg-black/40 backdrop-blur-md flex md:flex-col items-center justify-between p-4 z-20">
        <div className="mb-0 md:mb-8">
          <Activity className={`w-8 h-8 transition-colors duration-500 ${mode === AppMode.LIVE ? 'text-fuchsia-400 animate-pulse' : 'text-cyan-400'}`} />
        </div>
        
        <div className="flex md:flex-col gap-6">
          <button 
            onClick={() => setMode(AppMode.CHAT)}
            className={`p-3 rounded-xl transition-all duration-300 relative group ${mode === AppMode.CHAT ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-600 hover:text-cyan-400'}`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="absolute left-full ml-4 px-2 py-1 bg-cyan-900/80 border border-cyan-500/30 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:block hidden">Text Mode</span>
          </button>
          
          <button 
            onClick={() => setMode(AppMode.LIVE)}
            className={`p-3 rounded-xl transition-all duration-300 relative group ${mode === AppMode.LIVE ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-[0_0_15px_rgba(232,121,249,0.4)]' : 'text-slate-600 hover:text-fuchsia-400'}`}
          >
            <Zap className="w-6 h-6" />
             <span className="absolute left-full ml-4 px-2 py-1 bg-fuchsia-900/80 border border-fuchsia-500/30 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:block hidden">Live Mode</span>
          </button>
        </div>

        <div className="mt-auto hidden md:block">
           <div className="text-[10px] text-cyan-900 font-mono rotate-180 writing-mode-vertical">YUMI OS v1.0</div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-[calc(100vh-80px)] md:h-screen relative p-2 md:p-6 z-10 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 px-2">
           <div>
             <h1 className={`text-2xl md:text-3xl font-bold font-['Orbitron'] tracking-wider text-transparent bg-clip-text bg-gradient-to-r neon-text transition-all duration-1000 ${
                 mode === AppMode.CHAT ? 'from-cyan-400 to-blue-500' : 'from-fuchsia-400 to-rose-500'
             }`}>
               YUMI AI
             </h1>
             <p className="text-xs text-cyan-700/80 font-mono tracking-[0.2em] uppercase">
               Virtual Performer // <span className={mode === AppMode.LIVE ? 'text-fuchsia-400 animate-pulse' : 'text-cyan-600'}>{mode === AppMode.LIVE ? 'ON AIR' : 'STANDBY'}</span>
             </p>
           </div>
           
           {/* Enhanced Status Display */}
           <div className="flex items-center gap-6 bg-black/40 border border-cyan-900/30 rounded-lg p-2 px-4 backdrop-blur-md">
              
              {/* API Latency */}
              <div className="hidden sm:flex flex-col items-end">
                 <div className="flex items-center gap-1.5 text-[10px] text-cyan-500 font-mono tracking-wider">
                   <Wifi className="w-3 h-3" /> API LATENCY
                 </div>
                 <div className={`text-xs font-bold font-mono ${stats.latency > 500 ? 'text-yellow-400' : 'text-green-400'}`}>
                   {stats.latency > 0 ? `${stats.latency}ms` : '--'}
                 </div>
              </div>

              {/* Webcam Status */}
              <div className="hidden sm:flex flex-col items-end border-l border-cyan-900/30 pl-4">
                 <div className="flex items-center gap-1.5 text-[10px] text-cyan-500 font-mono tracking-wider">
                   <Video className="w-3 h-3" /> FEED
                 </div>
                 <div className={`text-xs font-bold font-mono ${stats.videoStatus === 'ONLINE' ? 'text-green-400' : 'text-slate-500'}`}>
                   {stats.videoStatus}
                 </div>
              </div>

              {/* Audio Status */}
              <div className="hidden sm:flex flex-col items-end border-l border-cyan-900/30 pl-4">
                 <div className="flex items-center gap-1.5 text-[10px] text-cyan-500 font-mono tracking-wider">
                   <Mic className="w-3 h-3" /> AUDIO
                 </div>
                 <div className={`text-xs font-bold font-mono ${
                   stats.audioQuality === 'OPTIMAL' ? 'text-green-400' : 
                   stats.audioQuality === 'PEAKING' ? 'text-red-400' : 'text-slate-500'
                 }`}>
                   {stats.audioQuality}
                 </div>
              </div>

              {/* Spinner */}
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center bg-cyan-950 ml-2 transition-colors duration-500 ${mode === AppMode.LIVE ? 'border-fuchsia-500/50' : 'border-cyan-500/50'}`}>
                 <div className={`w-full h-[1px] animate-[spin_4s_linear_infinite] ${mode === AppMode.LIVE ? 'bg-fuchsia-500/50' : 'bg-cyan-500/50'}`}></div>
              </div>
           </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 relative">
           {mode === AppMode.CHAT ? (
             <ChatInterface apiKey={apiKey} onStatsUpdate={handleStatsUpdate} />
           ) : (
             <LiveInterface apiKey={apiKey} onStatsUpdate={handleStatsUpdate} />
           )}
        </div>
      </main>
    </div>
  );
};

export default App;