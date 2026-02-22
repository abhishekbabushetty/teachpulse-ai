import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Video, Activity } from 'lucide-react';

export const Join: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSession = queryParams.get('session') || '';

  const [name, setName] = useState('');
  const [sessionUrl, setSessionUrl] = useState(initialSession);
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && sessionUrl) {
      // Extract session ID from URL or input
      let sessionId = sessionUrl;
      try {
        const url = new URL(sessionUrl);
        const params = new URLSearchParams(url.search);
        if (params.has('session')) {
            sessionId = params.get('session')!;
        } else {
            const parts = sessionUrl.split('/');
            sessionId = parts[parts.length - 1];
        }
      } catch (e) {
         // Not a URL, probably just a session ID string
         if (sessionUrl.includes('=')) {
             const parts = sessionUrl.split('=');
             sessionId = parts[parts.length - 1];
         }
      }
      navigate(`/meet/${sessionId}`, { state: { username: name } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6">
      
      <div className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
        
        <div className="flex justify-center mb-8">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex justify-center items-center shadow-lg shadow-emerald-500/20">
            <Activity className="text-white" size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-center text-white mb-2">Join Class</h2>
        <p className="text-slate-400 text-center text-sm font-medium mb-8">Enter your invite link to join the live session</p>

        <form onSubmit={handleJoin} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Your Full Name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Meeting ID or Link"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              value={sessionUrl}
              onChange={e => setSessionUrl(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            Join with Camera
          </button>
        </form>
      </div>
    </div>
  );
};
