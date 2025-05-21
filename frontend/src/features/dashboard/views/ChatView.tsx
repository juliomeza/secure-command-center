import React, { useState, useRef } from 'react';
import { sendChatMessage, ChatResponse } from './ChatApi';
import { useAuth } from '../../../auth/components/AuthProvider';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js/auto';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Simple table component for displaying JSON data as a table
const JsonTable: React.FC<{ data: any }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>No table data available.</div>;
  }
  const columns = Object.keys(data[0]);
  return (
    <div
      style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}
      className="custom-scroll-area"
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--gray-50)' }}>
          <tr>
            {columns.map(col => {
              // Format column name: remove underscores and capitalize each word
              const formattedCol = col.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
              return (
                <th key={col} style={{ padding: 8, color: 'var(--blue-dark)', fontWeight: 500, borderBottom: '1px solid var(--gray-200)', background: 'transparent', textAlign: 'left', fontSize: 16 }}>{formattedCol}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={idx} className={idx % 2 === 0 ? 'table-row-striped' : 'table-row-alt'}>
              {columns.map(col => (
                <td key={col} style={{ padding: 8, borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-800)', background: 'transparent', fontSize: 15, fontWeight: 400 }}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
.custom-scroll-area {
  scrollbar-width: thin;
  scrollbar-color: var(--blue-primary) var(--gray-100);
}
.custom-scroll-area::-webkit-scrollbar {
  width: 8px;
  background: transparent;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.custom-scroll-area:hover::-webkit-scrollbar {
  opacity: 1;
  pointer-events: auto;
}
.custom-scroll-area::-webkit-scrollbar-thumb {
  background: var(--blue-primary);
  border-radius: 8px;
}
.custom-scroll-area::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 8px;
}
.table-row-striped {
  background: var(--gray-100, #d1d5db) !important;
}
.table-row-alt {
  background: var(--gray-200, #eff6ff) !important;
}
`}</style>
    </div>
  );
};

// Component for displaying JSON data as a Bar Chart
const JsonBarChart: React.FC<{ data: any }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>No bar chart data available.</div>;
  }

  const labels = data.map(row => Object.values(row)[0]);
  const orderCounts = data.map(row => Object.values(row)[1]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Order Count',
        data: orderCounts,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Order Count per Warehouse',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Warehouse',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Order Count',
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

const VIEW_OPTIONS = [
  { label: 'Table', value: 'table' },
  { label: 'Bar', value: 'bar' },
  { label: 'Pie', value: 'pie' },
  { label: 'Line', value: 'line' },
];

const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [viewType, setViewType] = useState<'table' | 'bar' | 'pie' | 'line'>('table');
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
      <div style={{ flex: 1, minWidth: 0, maxWidth: '60%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingRight: 24 }}>
        {/* Toggle button group for view selection */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: 'flex-start', width: '100%' }}>
          {VIEW_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setViewType(option.value as any)}
              style={{
                padding: '8px 20px',
                borderRadius: 9999,
                border: viewType === option.value ? '2px solid var(--blue-primary)' : '1px solid var(--gray-200)',
                background: viewType === option.value ? 'var(--blue-primary)' : 'var(--gray-50)',
                color: viewType === option.value ? 'white' : 'var(--blue-dark)',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s, border 0.2s',
                boxShadow: viewType === option.value ? '0 2px 8px rgba(30,58,138,0.08)' : 'none',
                minWidth: 80
              }}
              disabled={option.value !== 'table' && option.value !== 'bar'} // Only Table and Bar enabled for now
            >
              {option.label}
            </button>
          ))}
        </div>
        {/* Dynamic content (tables/charts) */}
        <div style={{ width: '100%', flex: 1, minHeight: 0, background: 'transparent', borderRadius: 0, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-800)', fontSize: 20, fontWeight: 500, opacity: 1, boxShadow: 'none', overflow: 'auto' }}>
          {resultData ? (
            viewType === 'table' ? (
              <JsonTable data={resultData} />
            ) : viewType === 'bar' ? (
              <JsonBarChart data={resultData} />
            ) : (
              <div style={{ color: 'var(--blue-dark)', fontSize: 18, opacity: 0.7 }}>Not implemented yet.</div>
            )
          ) : 'Result area (tables or charts)'}
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
