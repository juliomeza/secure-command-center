import React, { useState, useRef } from 'react';
import { sendChatMessage, ChatResponse } from './ChatApi';
import { useAuth } from '../../../auth/components/AuthProvider';

// Simple table component for displaying JSON data as a table
const JsonTable: React.FC<{ data: any }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    return <div style={{ color: '#4a4e69', fontSize: 18, opacity: 0.7 }}>No table data available.</div>;
  }
  const columns = Object.keys(data[0]);
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #c9ada755' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} style={{ padding: 8, background: '#c9ada7', color: '#22223b', fontWeight: 700, border: '1px solid #c9ada7' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col} style={{ padding: 8, border: '1px solid #c9ada7', color: '#4a4e69', background: idx % 2 === 0 ? '#f2e9e4' : '#fff' }}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((msgs) => [...msgs, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const response: ChatResponse = await sendChatMessage(userMessage, user?.id?.toString() || 'anonymous');
      setMessages((msgs) => [...msgs, { sender: 'bot', text: response.answer }]); // Use 'answer' field
      setResultData(response.json_data || null); // Store json_data for table/chart
    } catch (err) {
      setError('Failed to get response from chat service.');
      setResultData(null);
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '75vh', background: '#ffe066', justifyContent: 'center', alignItems: 'center' }}>
      {/* Left area for tables or charts */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: '60%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: 24 }}>
        {/* Dynamic content (tables/charts) */}
        <div style={{ width: '100%', height: '90%', background: '#f2e9e4', borderRadius: 16, border: '2px dashed #c9ada7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a4e69', fontSize: 20, fontWeight: 500, opacity: 0.7, overflow: 'auto' }}>
          {resultData ? <JsonTable data={resultData} /> : 'Result area (tables or charts)'}
        </div>
      </div>
      {/* Chat on the right */}
      <div style={{ width: 420, minWidth: 320, maxWidth: 480, background: '#22223b', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '75vh', boxShadow: '0 0 24px #22223b55', borderRadius: 16, border: '2px solid #4a4e69' }}>
        <div style={{ padding: '2rem 0 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'transparent' }}>
          <div style={{
            border: 'none',
            borderRadius: 12,
            padding: 0,
            minHeight: 300,
            maxHeight: 500,
            overflowY: 'auto',
            background: 'transparent',
            marginBottom: 16,
            flex: 1,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
                <span style={{
                  background: msg.sender === 'user' ? '#9a8c98' : '#f2e9e420',
                  color: '#f2e9e4',
                  borderRadius: 8,
                  padding: '8px 14px',
                  maxWidth: '70%',
                  wordBreak: 'break-word',
                  fontSize: 15,
                  boxShadow: 'none',
                  border: '1px solid #c9ada7',
                  margin: msg.sender === 'user' ? '0 0 0 40px' : '0 40px 0 0'
                }}>{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 0, background: '#4a4e69', borderRadius: 8, border: '1px solid #c9ada7', padding: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: '10px 12px', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, color: '#f2e9e4' }}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ padding: '8px 22px', borderRadius: 6, background: loading || !input.trim() ? '#c9ada7' : '#9a8c98', color: loading || !input.trim() ? '#22223b' : 'white', border: 'none', fontWeight: 600, fontSize: 15, marginLeft: 8, transition: 'background 0.2s' }}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
