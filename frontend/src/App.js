import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

function App() {
  const [live, setLive] = useState([]);
  const [cur, setCur] = useState({ ecg: 0, spo2: 0, hr: 0, mock: true });
  const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

  useEffect(() => {
    const id = setInterval(async () => {
      try{
        const res = await fetch(`${API}/api/live`);
        const data = await res.json();
        setCur(data);
        setLive(prev => [...prev.slice(-100), { t: Date.now(), ecg: data.ecg }]);
      }catch(e){ console.log(e); }
    }, 300);
    return () => clearInterval(id);
  }, [API]);

  return (
    <div style={{ background: '#000', color: '#0f0', minHeight: '100vh', padding: 20, fontFamily: 'monospace' }}>
      <h1>ECG LIVE - AWS DynamoDB Prototype</h1>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ border: '2px solid #0f0', padding: 15, fontSize: 24 }}>HR: {cur.hr} BPM</div>
        <div style={{ border: '2px solid #0f0', padding: 15, fontSize: 24 }}>SpO2: {cur.spo2} %</div>
        <div style={{ border: '2px solid #0f0', padding: 15, fontSize: 24 }}>ECG: {Math.round(cur.ecg)}</div>
      </div>
      <div style={{ background: '#111', padding: 10, borderRadius: 10, height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={live}>
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide/>
            <Line type="monotone" dataKey="ecg" stroke="#00ff00" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p style={{color: cur.mock ? '#ff0' : '#0f0'}}>
        Backend: {API} | {cur.mock ? 'Mock Mode: ON (Local Test)' : 'LIVE Mode: ON - AWS DynamoDB Connected ✅'}
      </p>
    </div>
  );
}
export default App;
