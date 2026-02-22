import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, Users, Activity, MessageSquareWarning, Zap, Copy } from 'lucide-react';
import './index.css';

// Mock types
type Insight = { id: string; message: string; timestamp: Date };
type EmotionData = { name: string; value: number; color: string };

const Dashboard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [isConnected, setIsConnected] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [engagementHistory, setEngagementHistory] = useState<{time: string, score: number}[]>([]);
  const [currentEngagement, setCurrentEngagement] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [studentFeeds, setStudentFeeds] = useState<Record<string, { image: string, emotion: string, timestamp: number }>>({});
  
  const [emotions, setEmotions] = useState<EmotionData[]>([
    { name: 'Happy', value: 0, color: '#10b981' },
    { name: 'Neutral', value: 0, color: '#64748b' },
    { name: 'Surprise', value: 0, color: '#8b5cf6' },
    { name: 'Sad', value: 0, color: '#6366f1' },
    { name: 'Angry', value: 0, color: '#ef4444' },
    { name: 'Disgust', value: 0, color: '#f59e0b' },
    { name: 'Fear', value: 0, color: '#f97316' },
  ]);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize empty history to start
    const initialHistory = Array.from({length: 20}).map((_, i) => {
      const d = new Date();
      d.setSeconds(d.getSeconds() - (20 - i) * 2);
      return { time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), score: 0 };
    });
    setEngagementHistory(initialHistory);

    // Connect to WebSocket using the URL param
    const finalSessionId = sessionId || "session_123";
    const userId = "teacher_dashboard";
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/session/${finalSessionId}/${userId}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "student_count") {
          setActiveStudents(payload.data.count);
        } else if (payload.event === "emotion_update") {
          const data = payload.data;
          
          if (data.participant_id && payload.image) {
            setStudentFeeds(prev => ({
              ...prev,
              [data.participant_id]: {
                image: payload.image,
                emotion: data.emotion,
                timestamp: Date.now()
              }
            }));
          }
          
          if (data.engagement_score !== undefined) {
            setCurrentEngagement(prev => Math.round(data.engagement_score * 0.2 + prev * 0.8));
            
            const now = new Date();
            setEngagementHistory(prev => {
              const next = [...prev, {
                time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
                score: data.engagement_score
              }];
              if (next.length > 20) next.shift();
              return next;
            });
          }

          if (data.emotion) {
            setEmotions(prev => {
              return prev.map(e => {
                if(e.name.toLowerCase() === data.emotion.toLowerCase()) {
                  return { ...e, value: e.value + 1 };
                }
                return { ...e, value: Math.max(0, e.value - 0.1) };
              });
            });
          }
        } else if (payload.event === "new_insight") {
          setInsights(prev => [
            { id: Math.random().toString(), message: payload.data.message, timestamp: new Date() },
            ...prev
          ].slice(0, 5));
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 overflow-hidden">
      <header className="flex justify-between items-center mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex justify-center items-center shadow-lg shadow-indigo-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">TeachPulse-AI</h1>
            <p className="text-sm text-slate-400 font-medium tracking-wide">Live Session: Software Engineering 101 - Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigator.clipboard.writeText(`http://localhost:3000/join?session=${sessionId || "session_123"}`)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 py-2 text-white rounded-full font-semibold text-sm transition shadow-lg shadow-indigo-500/20 active:scale-95"
            title="Copy Student Invite Link"
          >
            <Copy size={16} />
            Invite Link
          </button>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <Users size={16} className="text-slate-400" />
            <span className="text-sm font-semibold">{activeStudents} Students</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 cursor-pointer hover:bg-slate-700 transition">
            <span className="text-sm font-medium">Link Status</span>
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition">
              <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><Brain size={100}/></div>
              <p className="text-sm text-slate-400 font-medium mb-1 relative z-10">Class Engagement</p>
              <div className="flex items-end gap-3 relative z-10">
                <h2 className="text-5xl font-black text-white">{currentEngagement}%</h2>
                <span className={`text-sm mb-2 font-medium ${currentEngagement > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  Average
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition">
              <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500"><Zap size={100}/></div>
              <p className="text-sm text-slate-400 font-medium mb-1 relative z-10">Live Peak</p>
              <div className="flex items-end gap-3 relative z-10">
                <h2 className="text-5xl font-black text-white">{Math.max(...engagementHistory.map(h => h.score).filter(s => !isNaN(s)) || [0]).toFixed(0)}%</h2>
                <span className="text-sm mb-2 text-purple-400 font-medium">Last 10s</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-center gap-2 hover:border-cyan-500/50 transition">
               <h3 className="text-sm text-slate-400 font-medium text-left">Dominant Mood</h3>
               <div className="text-2xl font-bold capitalize bg-slate-950 w-full py-4 text-center rounded-xl border border-slate-800 text-indigo-300 shadow-inner">
                 {emotions.reduce((acc, curr) => acc + curr.value, 0) === 0 ? "Waiting..." : emotions.reduce((prev, current) => (prev.value > current.value) ? prev : current).name}
               </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col flex-1 min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={20} className="text-purple-400"/> Engagement Timeline
              </h3>
            </div>
            <div className="flex-grow w-full h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementHistory}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickMargin={10} minTickGap={30} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickCount={5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#c4b5fd', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-indigo-400"/> Live Student Monitor
            </h3>
            {Object.keys(studentFeeds).length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                 <p>No active cameras detected</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(studentFeeds).map(([id, feed]) => {
                  const isActive = Date.now() - feed.timestamp < 5000;
                  if (!isActive) return null;
                  return (
                    <div key={id} className="relative rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-slate-950 aspect-video group">
                      <img src={`data:image/jpeg;base64,${feed.image}`} className="w-full h-full object-cover mirror" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex justify-between items-end">
                        <span className="text-xs font-medium text-white max-w-[100px] truncate" title={id}>{id.replace('student_', '')}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md capitalize">{feed.emotion}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col relative overflow-hidden flex-1 min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
            <div className="p-6 border-b border-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquareWarning size={20} className="text-emerald-400"/> AI Teaching Copilot
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900/50">
              {insights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Brain size={48} className="text-slate-700 opacity-50" />
                  <p className="text-sm italic text-center max-w-[200px]">Monitoring metrics. Suggestions will appear here automatically.</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div key={insight.id} className="bg-slate-800/80 rounded-xl p-4 border border-emerald-500/20 relative shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mistral-7B Insight</span>
                      <span className="text-xs font-medium text-slate-500">{insight.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-[15px] text-slate-200 leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-[300px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-2">Emotion Distribution</h3>
            <div className="flex-grow w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotions.filter(e => e.value > 0)}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={(props: any) => {
                      const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
                      if (percent === undefined || midAngle === undefined) return null;
                      const radius = innerRadius + (outerRadius - innerRadius) + 15;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      if (percent < 0.05) return null; // Hide labels for tiny slices
                      return (
                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {emotions.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-200">
                  {emotions.reduce((a, b) => a + b.value, 0).toFixed(0)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Frames</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
