import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Avatar3D, Avatar3DRef } from './Avatar3D';
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
  const [isLoading, setIsLoading] = useState(true);
  const avatarRef = useRef<Avatar3DRef>(null);

  useEffect(() => {
    onStatsUpdate({
      videoStatus: 'ONLINE',
      audioQuality: 'OPTIMAL'
    });

    // Handle Riko connection status
    const handleConnection = (data: any) => {
      setConnectionStatus(data.status === 'connected' ? 'connected' : 'disconnected');
    };

    // Handle speaking messages from Riko
    const handleSpeaking = (msg: { type: string; text?: string; duration?: number }) => {
      if (msg.duration) {
        avatarRef.current?.speak(msg.duration);
      }
    };

    rikoService.on('connection', handleConnection);
    rikoService.on('speaking', handleSpeaking);

    // Simulate initial connection attempt
    setTimeout(() => {
      setConnectionStatus('disconnected');
    }, 2000);

    return () => {
      rikoService.off('connection', handleConnection);
      rikoService.off('speaking', handleSpeaking);
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
      // Trigger mouth animation for response
      avatarRef.current?.speak(2000);
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

  const handleAvatarLoad = useCallback(() => {
    console.log('Avatar3D loaded successfully');
    setIsLoading(false);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0d0221] rounded-lg border border-fuchsia-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)] overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent h-[200%] w-full animate-scanline pointer-events-none" />
      
      <Canvas
        className="w-full h-full"
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#0d0221']} />
        
        {/* Lighting setup per requirements */}
        <ambientLight intensity={0.4} color="#a855f7" />
        <pointLight position={[2, 2, 2]} intensity={1.5} color="#ec4899" />
        <pointLight position={[-2, -1, -2]} intensity={0.8} color="#8b5cf6" />
        
        {/* Avatar */}
        <Avatar3D 
          ref={avatarRef}
          onLoad={handleAvatarLoad}
          onMouthAnimation={handleMouthAnimation}
        />
        
        {/* Camera controls */}
        <OrbitControls enableZoom={false} />
      </Canvas>
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0221]/80 backdrop-blur-sm">
          <div className="text-fuchsia-400 font-mono animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="mt-4 text-center text-sm">Loading Avatar...</p>
          </div>
        </div>
      )}

      {/* Connection status */}
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

      {/* Latency display */}
      {latency > 0 && (
        <div className="absolute top-4 right-4 bg-black/60 border border-fuchsia-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
          <span className="text-xs font-mono text-cyan-300">
            LATENCY: {latency}ms
          </span>
        </div>
      )}

      {/* Input controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-fuchsia-500/20 bg-black/60 backdrop-blur-md">
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
