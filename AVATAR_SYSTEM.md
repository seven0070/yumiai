# YUMI AI 3D Avatar System

## Overview
A complete 3D avatar system for YUMI AI featuring auto-blinking animations, cyberpunk styling, and Riko integration readiness built with Three.js and React Three Fiber.

## Features

### ✨ 3D Avatar Rendering
- **GLB Model Loading**: Loads the fantasy female character 3D model from `/public/fantasy-female-character.glb`
- **Auto-centering & Scaling**: Automatically centers and scales the model to fit the viewport using Box3 calculations
- **Dynamic Lighting**: Cyberpunk-themed lighting with neon pink and purple colors
- **Smooth Rotation**: Subtle idle animation with natural head movement

### 👁️ Auto-Blinking System
- **Realistic Timing**: Blinks every ~4.5 seconds with 150ms duration
- **Eye Detection**: Automatically finds eye meshes by name patterns (`eye`, `eyelid`, `lid`)
- **Heuristic Fallback**: If name-based detection fails, uses geometry size and position heuristics
- **Smooth Animation**: Y-scale manipulation for natural eyelid closure (scales to 0.1 at peak)

### 🎤 Mouth Animation (Riko Ready)
- **Trigger System**: Global function `window.__triggerMouthAnimation(intensity)` for external control
- **Smooth Interpolation**: Lerped intensity values for natural movement
- **Integration Ready**: Designed for Riko voice/text response triggers

### 🌐 Riko Service Integration
- **WebSocket Connection**: Primary connection method to `ws://localhost:5000/ws`
- **HTTP Fallback**: Falls back to HTTP POST to `http://localhost:5000/chat` if WebSocket unavailable
- **Auto-reconnect**: Exponential backoff reconnection (max 5 attempts)
- **Event System**: Observable events for `connection`, `text`, `audio`, and `emotion`
- **Graceful Degradation**: Works offline with console warnings

## Architecture

### File Structure
```
src/
├── components/
│   ├── Avatar3D.tsx          # 3D model component with animations
│   ├── LiveInterface.tsx     # Three.js Canvas with cyberpunk UI
│   └── ChatInterface.tsx     # Text chat UI component
├── services/
│   └── riko.ts              # Riko AI integration service
├── types/
│   └── index.ts             # TypeScript type definitions
├── App.tsx                  # Main app with mode switching
└── index.tsx                # React entry point

public/
└── fantasy-female-character.glb  # 23MB 3D model file
```

### Component Details

#### Avatar3D Component
**Props:**
- `onMouthAnimation?: (intensity: number) => void` - Callback for mouth animation events

**Features:**
- Clones scene to avoid mutations
- Computes bounding box for auto-scaling
- Traverses scene graph to find eye meshes
- Uses `useFrame` hook for per-frame animation updates
- Maintains original eye scales for proper animation reset

**Eye Detection Strategy:**
1. Name-based: Searches for meshes with "eye", "eyelid", "lid" in name
2. Heuristic: Falls back to geometry size and position analysis
3. Logs all found meshes for debugging

#### LiveInterface Component
**Props:**
- `apiKey: string` - Gemini API key (future use)
- `onStatsUpdate: (stats: Partial<SystemStats>) => void` - System stats callback

**Features:**
- React Three Fiber Canvas with optimized settings
- Ambient, point, and spot lighting for cyberpunk aesthetic
- OrbitControls for user interaction (zoom, rotate)
- Connection status indicator (RIKO ONLINE/OFFLINE)
- Latency display for API calls
- Message input with keyboard shortcuts
- Microphone toggle for future voice input

#### Riko Service
**Methods:**
- `sendMessage(message: string): Promise<RikoResponse | null>` - Send text message
- `triggerMouthAnimation(intensity: number)` - Trigger avatar mouth movement
- `on(event: string, callback: Function)` - Subscribe to events
- `off(event: string, callback: Function)` - Unsubscribe from events
- `disconnect()` - Clean up connections

**Events:**
- `connection` - Connection status changes
- `text` - Text response received
- `audio` - Audio response received
- `emotion` - Emotion change detected

## Usage

### Basic Setup
The Avatar3D component is already integrated into LiveInterface. Switch to "Live Mode" in the app to see the 3D avatar.

### Triggering Mouth Animations
From anywhere in the application:
```typescript
// Trigger mouth movement (intensity 0.0 - 1.0)
if (typeof window.__triggerMouthAnimation === 'function') {
  window.__triggerMouthAnimation(0.8);
}
```

### Sending Messages to Riko
```typescript
import { rikoService } from './services/riko';

// Send a message
const response = await rikoService.sendMessage('Hello YUMI!');
if (response) {
  console.log('Response:', response.text);
}

// Listen for events
rikoService.on('text', (text) => {
  console.log('Received text:', text);
});
```

## Configuration

### Blink Timing
Edit `src/components/Avatar3D.tsx`:
```typescript
const blinkStateRef = useRef({
  isBlinking: false,
  lastBlinkTime: performance.now(),
  blinkStartTime: 0,
  blinkDuration: 150,      // Adjust blink speed (ms)
  blinkInterval: 4500      // Adjust blink frequency (ms)
});
```

### Lighting & Colors
Edit `src/components/LiveInterface.tsx`:
```tsx
<ambientLight intensity={0.3} color="#9333ea" />
<pointLight position={[5, 5, 5]} intensity={1.2} color="#ec4899" />
<pointLight position={[-5, -5, 5]} intensity={0.8} color="#06b6d4" />
```

### Model Scaling
Edit `src/components/Avatar3D.tsx`:
```typescript
const scale = 2.5 / maxDim;  // Adjust this value for size
```

## Riko Server Integration

### Expected Server Endpoints

**WebSocket**: `ws://localhost:5000/ws`
- Accepts JSON messages: `{ type: 'text', content: string, timestamp: number }`
- Emits: `{ type: 'text_response' | 'audio_response' | 'emotion', content: any }`

**HTTP**: `POST http://localhost:5000/chat`
- Body: `{ message: string, timestamp: number }`
- Response: `{ text: string, emotion?: string, audioUrl?: string }`

### Current Status
⚠️ **Riko server is not yet implemented**. The service includes:
- Full client-side implementation ready
- Graceful fallbacks and error handling
- Console warnings when server is offline
- No blocking behavior - app works without server

### To Implement Riko Server
1. Create HTTP server on port 5000
2. Implement WebSocket endpoint `/ws`
3. Implement POST endpoint `/chat`
4. Return responses in expected JSON format
5. Optionally: Send emotion and audio data

## Performance Notes

- **Model Size**: 23MB GLB file - consider lazy loading or compression for production
- **Bundle Size**: 560KB after minification - consider code splitting
- **Animation Loop**: Uses `requestAnimationFrame` via `useFrame` for optimal performance
- **Eye Mesh Detection**: Runs once on mount, cached for animation loop

## Troubleshooting

### Avatar Not Visible
- Check console for "Avatar3D initialized" message
- Verify GLB file exists at `/public/fantasy-female-character.glb`
- Check Three.js Canvas background color (should be `#0d0221`)

### Blink Animation Not Working
- Check console for "Found eye mesh" messages
- If no eye meshes found, heuristic detection will attempt
- Verify model has proper mesh names or geometry

### Riko Connection Failed
- This is expected if server is not running
- Check console for "RikoService: WebSocket error" warnings
- App continues to work offline

### Build Warnings
- Chunk size warning is expected due to Three.js bundle size
- Consider implementing dynamic imports for production optimization

## Future Enhancements

- [ ] Implement actual Riko HTTP server
- [ ] Add lip-sync based on audio analysis
- [ ] Implement facial expression changes based on emotion
- [ ] Add physics-based hair/clothing animation
- [ ] Optimize model compression (reduce from 23MB)
- [ ] Add loading states and progress indicators
- [ ] Implement voice input via Web Audio API
- [ ] Add customizable avatar appearances
- [ ] Record and playback avatar animations
- [ ] Multi-avatar support for conversations

## Dependencies

```json
{
  "three": "^0.169.0",
  "@react-three/fiber": "^8.17.0",
  "@react-three/drei": "^9.114.0",
  "@types/three": "latest"
}
```

Note: Installed with `--legacy-peer-deps` due to React 19 compatibility.

## License
Part of YUMI AI OS project.
