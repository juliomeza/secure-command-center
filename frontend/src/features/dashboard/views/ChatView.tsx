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
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Chat</h2>
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        minHeight: 300,
        maxHeight: 400,
        overflowY: 'auto',
        background: '#fafbfc',
        marginBottom: 16
      }}>
        {messages.length === 0 && <div style={{ color: '#888' }}>Start the conversation...</div>}
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            textAlign: msg.sender === 'user' ? 'right' : 'left',
            margin: '8px 0'
          }}>
            <span style={{
              display: 'inline-block',
              background: msg.sender === 'user' ? '#2563eb' : '#e5e7eb',
              color: msg.sender === 'user' ? 'white' : '#222',
              borderRadius: 16,
              padding: '8px 14px',
              maxWidth: '80%',
              wordBreak: 'break-word'
            }}>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: '0 18px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', fontWeight: 600 }}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
};

export default ChatView;
