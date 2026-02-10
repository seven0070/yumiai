# Quick Start Guide - YUMI AI 3D Avatar System

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variable
Create a `.env` file in the project root:
```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

### 4. Switch to Live Mode
Click the "⚡ Zap" icon in the sidebar to see the 3D avatar.

## 🎯 What You'll See

### Live Mode (3D Avatar)
- **3D Model**: Fantasy female character with auto-blinking eyes
- **Cyberpunk Lighting**: Neon pink and purple with fog effects
- **Controls**: 
  - Drag to rotate
  - Scroll to zoom (3-8 units)
  - Auto-rotation with idle animation
- **Auto-Blinking**: Every ~4.5 seconds with 150ms duration

### Chat Mode
- Text-based chat interface
- Placeholder responses (Gemini integration ready)
- Message history with timestamps

## 🧪 Testing the Avatar

### Manual Mouth Animation Test
Open browser console and type:
```javascript
window.__triggerMouthAnimation(0.8)
```

### Check Eye Mesh Detection
Look for console messages:
```
Avatar3D initialized with X eye meshes for blinking
Found eye mesh: [mesh name]
```

### Test Riko Service
```javascript
// In browser console
import { rikoService } from './src/services/riko'
rikoService.sendMessage('Hello YUMI!')
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Avatar3D.tsx          # 3D avatar component
│   ├── LiveInterface.tsx     # Three.js Canvas wrapper
│   └── ChatInterface.tsx     # Text chat UI
├── services/
│   └── riko.ts              # Riko AI service
├── types/
│   └── index.ts             # TypeScript types
├── App.tsx                   # Main app
└── index.tsx                 # Entry point

public/
└── fantasy-female-character.glb  # 3D model
```

## 🔧 Configuration

### Adjust Blink Timing
Edit `src/components/Avatar3D.tsx`:
```typescript
blinkDuration: 150,      // Blink speed (ms)
blinkInterval: 4500      // Blink frequency (ms)
```

### Change Avatar Scale
Edit `src/components/Avatar3D.tsx`:
```typescript
const scale = 2.5 / maxDim;  // Change 2.5 to adjust size
```

### Modify Lighting
Edit `src/components/LiveInterface.tsx`:
```tsx
<ambientLight intensity={0.3} color="#9333ea" />
<pointLight position={[5, 5, 5]} intensity={1.2} color="#ec4899" />
```

## 🐛 Troubleshooting

### Avatar Not Visible
1. Check console for "Avatar3D initialized" message
2. Verify GLB file exists: `public/fantasy-female-character.glb`
3. Check Three.js Canvas background: should be dark purple (#0d0221)

### Blink Animation Not Working
1. Look for "Found eye mesh" in console
2. If no meshes found, check model structure
3. Heuristic detection will attempt as fallback

### Riko Connection Failed
- ✅ **This is expected** - Riko server not yet implemented
- App continues to work offline
- Check console for connection warnings

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Rebuild
npm run build
```

## 📚 Documentation

- **Full System Docs**: See `AVATAR_SYSTEM.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **This Guide**: `QUICKSTART.md`

## 🎨 Features Implemented

✅ 3D model loading and rendering  
✅ Auto-blinking animation system  
✅ Cyberpunk lighting and styling  
✅ Mouth animation trigger system  
✅ Riko service stub (client-side complete)  
✅ WebSocket + HTTP communication structure  
✅ Live/Chat mode switching  
✅ Interactive OrbitControls  
✅ Connection status indicators  
✅ TypeScript type safety  

## 🔮 Next Steps

### To Implement Riko Server:
1. Create HTTP server on port 5000
2. Add WebSocket endpoint: `ws://localhost:5000/ws`
3. Add REST endpoint: `POST http://localhost:5000/chat`
4. Return JSON: `{ text: string, emotion?: string }`

### To Test with Riko:
1. Start Riko server: `python riko_project/server/main_chat.py`
2. Send message in Live Mode
3. Watch for mouth animation triggers
4. Check console for response logs

## 💡 Tips

- **Performance**: The 23MB GLB model may take time to load
- **Browser**: Use Chrome/Firefox for best Three.js support
- **DevTools**: Keep console open to see animation logs
- **Zoom**: Use scroll wheel to get closer view of avatar
- **Rotation**: Drag anywhere on canvas to rotate view

## 🆘 Support

Issues? Check:
1. Node version: `node -v` (should be 18+)
2. Build output: `npm run build`
3. Console errors in browser DevTools
4. GLB file size: Should be ~23MB

## 🎉 Success Indicators

When working correctly:
- ✅ 3D model visible in Live Mode
- ✅ Eyes blink every few seconds
- ✅ Model rotates slightly with idle animation
- ✅ Can rotate and zoom with mouse
- ✅ Neon lighting creates cyberpunk atmosphere
- ✅ No console errors (except Riko connection warnings)

---

**Ready to develop?** Run `npm run dev` and start building! 🚀
