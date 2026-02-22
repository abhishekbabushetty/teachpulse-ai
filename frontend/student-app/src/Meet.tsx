import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import './index.css';

const Meet: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const username = location.state?.username || "student_" + Math.floor(Math.random() * 1000);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket using sessionId and username
    const finalSessionId = sessionId || "session_123";
    const wsUserId = "student_" + username.replace(/\s+/g, '_').toLowerCase();
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/session/${finalSessionId}/${wsUserId}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "emotion_update" && payload.data.participant_id === wsUserId) {
           setCurrentMood(payload.data.emotion);
        }
      } catch (err) {
        console.error("Failed to parse socket message", err);
      }
    };
    
    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    // Start Webcam
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }).catch(err => console.error("Camera error:", err));
    }
  }, []);

  useEffect(() => {
    // Extract frame 1 FPS
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current && isConnected && socketRef.current?.readyState === WebSocket.OPEN) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          // Draw video frame to hidden canvas
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          
          canvasRef.current.toBlob((blob) => {
            if (blob) {
              socketRef.current?.send(blob);
            }
          }, 'image/jpeg', 0.5); // compress slightly
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-3xl w-full bg-gray-800 rounded-3xl p-8 shadow-2xl glassmorphism">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-emerald-400">TeachPulse-AI</h1>
            <p className="text-gray-400 mt-1">Real-time Student Portal</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-full shadow-inner">
            <span className="text-sm font-medium text-gray-300">Status</span>
            <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
        </header>

        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-black shadow-lg bg-gray-950 border border-gray-700">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover mirror"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay elements */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-white/90">TRANSMITTING</span>
          </div>
          
          {currentMood && (
             <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-700 shadow-lg flex items-center gap-3">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detected Mood</span>
               <span className="text-lg font-black text-emerald-400 capitalize">{currentMood}</span>
             </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Sending encrypted 1FPS feed to emotion engine.
        </div>
      </div>
    </div>
  );
};

export default Meet;
