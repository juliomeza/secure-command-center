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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '75vh', background: '#ffe066' }}>
      {/* Chat only, centered */}
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
