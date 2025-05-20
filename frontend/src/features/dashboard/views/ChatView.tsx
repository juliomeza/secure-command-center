import React, { useState, useRef } from 'react';
import { sendChatMessage, ChatResponse } from './ChatApi';
import { useAuth } from '../../../auth/components/AuthProvider';

// Simple table component for displaying JSON data as a table
const JsonTable: React.FC<{ data: any }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>No table data available.</div>;
  }
  const columns = Object.keys(data[0]);
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} style={{ padding: 8, color: 'var(--blue-dark)', fontWeight: 600, borderBottom: '1px solid var(--gray-200)', background: 'transparent', textAlign: 'left', fontSize: 15 }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={idx} style={{ background: 'transparent' }}>
              {columns.map(col => (
                <td key={col} style={{ padding: 8, borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-800)', background: 'transparent', fontSize: 15 }}>{row[col]}</td>
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
  const inputRef = useRef<HTMLInputElement>(null);

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
        inputRef.current?.focus(); // Focus the input after sending
      }, 100);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '75vh', background: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
      {/* Left area for tables or charts */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: '60%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: 24 }}>
        {/* Dynamic content (tables/charts) */}
        <div style={{ width: '100%', height: '90%', background: 'transparent', borderRadius: 0, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-800)', fontSize: 20, fontWeight: 500, opacity: 1, boxShadow: 'none', overflow: 'auto' }}>
          {resultData ? <JsonTable data={resultData} /> : 'Result area (tables or charts)'}
        </div>
      </div>
      {/* Chat on the right */}
      <div style={{ width: 420, minWidth: 320, maxWidth: 480, background: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '75vh', boxShadow: 'none', borderRadius: 0, border: 'none' }}>
        <div style={{ padding: '2rem 0 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'transparent' }}>
          <div
            style={{
              border: 'none',
              borderRadius: 0,
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
              gap: 18, // more space between bubbles
              position: 'relative'
            }}
            className="chat-scroll-area"
          >
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
                <span style={{
                  background: msg.sender === 'user' ? 'var(--blue-primary)' : 'transparent',
                  color: msg.sender === 'user' ? 'white' : 'var(--blue-dark)',
                  borderRadius: msg.sender === 'user' ? '10px 10px 2px 10px' : 0, // less rounded for user bubble
                  padding: msg.sender === 'user' ? '12px 22px' : 0,
                  maxWidth: msg.sender === 'user' ? '70%' : '100%', // bot responses use full width
                  minWidth: msg.sender === 'user' ? 0 : '90%', // bot responses use more width
                  wordBreak: 'break-word',
                  fontSize: 16,
                  boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(30,58,138,0.08)' : 'none',
                  border: 'none',
                  margin: msg.sender === 'user' ? '0 0 0 40px' : '0 40px 0 0',
                  backgroundClip: 'padding-box',
                  opacity: 1,
                  transition: 'background 0.2s',
                  display: 'inline-block',
                  textAlign: 'left',
                  lineHeight: 1.5
                }}>{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} style={{
            display: 'flex',
            gap: 0,
            background: 'var(--gray-50)',
            borderRadius: 9999,
            border: '1px solid var(--gray-200)',
            padding: 8,
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(30,58,138,0.06)',
            marginTop: 12,
            marginBottom: 0,
            position: 'relative',
            minHeight: 48
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 16,
                color: 'var(--blue-dark)',
                borderRadius: 9999
              }}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              padding: '10px 28px',
              borderRadius: 9999,
              background: loading || !input.trim() ? 'var(--gray-200)' : 'var(--blue-primary)',
              color: loading || !input.trim() ? 'var(--gray-500)' : 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: 16,
              marginLeft: 8,
              transition: 'background 0.2s',
              boxShadow: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              minWidth: 80
            }}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
          {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
