import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Avatar3D } from './Avatar3D';
import { SystemStats } from '../types';
import { rikoService } from '../services/riko';
import { Mic, MicOff, Send } from 'lucide-react';

interface LiveInterfaceProps {
  apiKey: string;
  onStatsUpdate: (stats: Partial<SystemStats>) => void;
}

const LiveInterface: React.FC<LiveInterfaceProps> = ({ apiKey, onStatsUpdate }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    onStatsUpdate({
      videoStatus: 'ONLINE',
      audioQuality: 'OPTIMAL'
    });

    const handleConnection = (data: any) => {
      setConnectionStatus(data.status === 'connected' ? 'connected' : 'disconnected');
    };

    rikoService.on('connection', handleConnection);

    setTimeout(() => {
      setConnectionStatus('disconnected');
    }, 2000);

    return () => {
      rikoService.off('connection', handleConnection);
      onStatsUpdate({
        videoStatus: 'OFFLINE',
        audioQuality: 'N/A'
      });
    };
  }, [onStatsUpdate]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const startTime = performance.now();
    const message = inputMessage;
    setInputMessage('');

    console.log('Sending message to Riko:', message);

    const response = await rikoService.sendMessage(message);
    const endTime = performance.now();
    const messageLatency = Math.round(endTime - startTime);
    
    setLatency(messageLatency);
    onStatsUpdate({ latency: messageLatency });

    if (response) {
      console.log('Received response from Riko:', response);
    } else {
      console.log('No response from Riko (server may be offline)');
    }
  }, [inputMessage, onStatsUpdate]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    onStatsUpdate({
      audioQuality: !isListening ? 'PEAKING' : 'OPTIMAL'
    });
  };

  const handleMouthAnimation = useCallback((intensity: number) => {
    console.log('Mouth animation triggered with intensity:', intensity);
  }, []);

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-fuchsia-500/20 bg-[#0d0221]/40 backdrop-blur-md shadow-[0_0_50px_rgba(232,121,249,0.15)]">
      
      <div className="flex-1 relative">
        <Canvas
          className="w-full h-full"
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
          }}
        >
          <color attach="background" args={['#0d0221']} />
          
          <fog attach="fog" args={['#0d0221', 5, 15]} />
          
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
          
          <ambientLight intensity={0.3} color="#9333ea" />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#ec4899" />
          <pointLight position={[-5, -5, 5]} intensity={0.8} color="#06b6d4" />
          <spotLight
            position={[0, 10, 0]}
            angle={0.3}
            penumbra={1}
            intensity={0.5}
            color="#e879f9"
            castShadow
          />
          
          <Avatar3D onMouthAnimation={handleMouthAnimation} />
          
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>

        <div className="absolute top-4 left-4 bg-black/60 border border-fuchsia-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
            <span className="text-xs font-mono text-cyan-300">
              {connectionStatus === 'connected' ? 'RIKO CONNECTED' :
               connectionStatus === 'connecting' ? 'CONNECTING...' :
               'RIKO OFFLINE'}
            </span>
          </div>
        </div>

        {latency > 0 && (
          <div className="absolute top-4 right-4 bg-black/60 border border-fuchsia-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
            <span className="text-xs font-mono text-cyan-300">
              LATENCY: {latency}ms
            </span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-fuchsia-500/20 bg-black/40">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-lg transition-all duration-300 ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/20'
            }`}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Send a message to YUMI..."
            className="flex-1 bg-black/60 border border-fuchsia-500/30 rounded-lg px-4 py-3 text-cyan-50 placeholder-cyan-700 focus:outline-none focus:border-fuchsia-400 focus:shadow-[0_0_15px_rgba(232,121,249,0.2)] transition-all font-mono text-sm"
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="p-3 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 hover:bg-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_15px_rgba(232,121,249,0.2)]"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-2 text-xs text-cyan-700 font-mono">
          Press Enter to send • ESC to cancel
        </div>
      </div>
    </div>
  );
};

export default LiveInterface;
