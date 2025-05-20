import React, { useState, useRef } from 'react';
import { sendChatMessage, ChatResponse } from './ChatApi';
import { useAuth } from '../../../auth/components/AuthProvider';

const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError('Failed to get response from chat service.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f6fa' }}>
      {/* Left side: Data/Table/Chart placeholder */}
      <div style={{ flex: 1, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ width: '100%', textAlign: 'center', color: '#bbb', fontSize: 20, border: '2px dashed #e5e7eb', borderRadius: 12, padding: 40 }}>
          Data results (tables or charts) will appear here.
        </div>
      </div>
      {/* Right side: Chat */}
      <div style={{ width: 420, minWidth: 320, maxWidth: 480, background: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100vh', boxShadow: 'none' }}>
        <div style={{ padding: '2rem 0 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'transparent' }}>
          <h2 style={{ marginBottom: 16, color: '#222', fontWeight: 700 }}>Chat</h2>
          <div style={{
            border: 'none',
            borderRadius: 12,
            padding: 0,
            minHeight: 300,
            maxHeight: 400,
            overflowY: 'auto',
            background: 'transparent',
            marginBottom: 16,
            flex: 1,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            {messages.length === 0 && <div style={{ color: '#888', padding: 24, background: '#f8f9fb', borderRadius: 10 }}>Start the conversation...</div>}
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
                <span style={{
                  background: msg.sender === 'user' ? '#2563eb10' : '#e5e7eb60',
                  color: '#222',
                  borderRadius: 8,
                  padding: '8px 14px',
                  maxWidth: '70%',
                  wordBreak: 'break-word',
                  fontSize: 15,
                  boxShadow: 'none',
                  border: '1px solid #e5e7eb',
                  margin: msg.sender === 'user' ? '0 0 0 40px' : '0 40px 0 0'
                }}>{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 0, background: '#f8f9fb', borderRadius: 8, border: '1px solid #e5e7eb', padding: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: '10px 12px', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, color: '#222' }}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ padding: '8px 22px', borderRadius: 6, background: loading || !input.trim() ? '#dbeafe' : '#2563eb', color: loading || !input.trim() ? '#2563eb' : 'white', border: 'none', fontWeight: 600, fontSize: 15, marginLeft: 8, transition: 'background 0.2s' }}>
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
