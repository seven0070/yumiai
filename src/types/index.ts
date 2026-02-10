export enum AppMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE'
}

export interface SystemStats {
  latency: number;
  videoStatus: 'ONLINE' | 'OFFLINE';
  audioQuality: 'OPTIMAL' | 'PEAKING' | 'N/A';
}

export interface RikoMessage {
  type: 'text' | 'audio' | 'status';
  content?: string;
  audioData?: ArrayBuffer;
  timestamp: number;
}

export interface RikoResponse {
  text: string;
  emotion?: string;
  audioUrl?: string;
}
