import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatResponse } from './ChatApi';
import { useAuth } from '../../../auth/components/AuthProvider';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js/auto';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
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
            {columns.map(_col => {
              // Format column name: remove underscores and capitalize each word
              const formattedCol = _col.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
              return (
                <th key={_col} style={{ padding: 8, color: 'var(--blue-dark)', fontWeight: 500, borderBottom: '1px solid var(--gray-200)', background: 'transparent', textAlign: 'left', fontSize: 16 }}>{formattedCol}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, idx: number) => (
            <tr key={idx} className={idx % 2 === 0 ? 'table-row-striped' : 'table-row-alt'}>
              {columns.map(_col => (
                <td key={_col} style={{ padding: 8, borderBottom: '1px solid var(--gray-100)', color: 'var(--gray-800)', background: 'transparent', fontSize: 15, fontWeight: 400 }}>{row[_col]}</td>
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

  const columns = Object.keys(data[0]);

  let chartData;
  let options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
        },
      },
      y: {
        title: {
          display: true,
        },
      },
    },
  };

  if (columns.length === 2) {
    // Simple label-value case
    const labels = data.map(row => Object.values(row)[0]);
    const values = data.map(row => Object.values(row)[1]);

    chartData = {
      labels,
      datasets: [
        {
          label: toTitleCase(columns[1]) || 'Value',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.3)',
            'rgba(255, 159, 64, 0.3)',
            'rgba(255, 205, 86, 0.3)',
            'rgba(75, 192, 192, 0.3)',
            'rgba(54, 162, 235, 0.3)',
            'rgba(153, 102, 255, 0.3)',
            'rgba(201, 203, 207, 0.3)',
          ],
          borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1,
        },
      ],
    };
    options.plugins.title.text = `${toTitleCase(columns[1]) || 'Value'} per ${toTitleCase(columns[0]) || 'Label'}`;
    options.scales.x.title.text = toTitleCase(columns[0]) || 'Label';
    options.scales.y.title.text = toTitleCase(columns[1]) || 'Value';

  } else if (columns.length === 3) {
    // Assuming structure like [Category, Label, Value]
    const categoryColumn = columns[0];
    const labelColumn = columns[1];
    const valueColumn = columns[2];

    const categories = Array.from(new Set(data.map(row => row[categoryColumn])));
    const labels = Array.from(new Set(data.map(row => row[labelColumn])));

    chartData = {
      labels,
      datasets: categories.map((category, index) => ({
        label: toTitleCase(category),
        data: labels.map(label => {
          const row = data.find(item => item[categoryColumn] === category && item[labelColumn] === label);
          return row ? row[valueColumn] : 0;
        }),
        backgroundColor: `rgba(${(index * 80) % 255}, ${(index * 150) % 255}, ${(index * 200) % 255}, 0.5)`,
      })),
    };

    options.plugins.title.text = `${toTitleCase(valueColumn)} per ${toTitleCase(labelColumn)} grouped by ${toTitleCase(categoryColumn)}`;
    options.scales.x.title.text = toTitleCase(labelColumn);
    options.scales.y.title.text = toTitleCase(valueColumn);
    options.scales.x.stacked = false; // Ensure bars are grouped, not stacked by default
    options.scales.y.stacked = false;

  } else if (columns.length === 4) {
    // Assuming structure like [Year, Order Type, Warehouse, Count]
    const yearColumn = columns[0];
    const orderTypeColumn = columns[1];
    const warehouseColumn = columns[2];
    const countColumn = columns[3];

    const years = Array.from(new Set(data.map(row => row[yearColumn])));
    const orderTypes = Array.from(new Set(data.map(row => row[orderTypeColumn])));
    const warehouses = Array.from(new Set(data.map(row => row[warehouseColumn])));

    // Sort warehouses numerically if they are numbers
    warehouses.sort((a, b) => (typeof a === 'number' && typeof b === 'number') ? a - b : String(a).localeCompare(String(b)));

    chartData = {
      labels: warehouses,
      datasets: years.flatMap(year =>
        orderTypes.map((orderType, _index) => ({
          label: `${toTitleCase(year.toString())} - ${toTitleCase(orderType.toString())}`,
          data: warehouses.map(warehouse => {
            const row = data.find(item =>
              item[yearColumn] === year &&
              item[orderTypeColumn] === orderType &&
              item[warehouseColumn] === warehouse
            );
            return row ? row[countColumn] : 0;
          }),
          backgroundColor: `hsla(${(years.indexOf(year) * 120 + _index * 60) % 360}, 70%, 50%, 0.7)`,
          borderColor: `hsl(${(years.indexOf(year) * 120 + _index * 60) % 360}, 70%, 50%)`,
          borderWidth: 1,
        }))
      ),
    };

    options.plugins.title.text = `${toTitleCase(countColumn)} by ${toTitleCase(warehouseColumn)}, ${toTitleCase(orderTypeColumn)}, and ${toTitleCase(yearColumn)}`;
    options.scales.x.title.text = toTitleCase(warehouseColumn);
    options.scales.y.title.text = toTitleCase(countColumn);
    options.scales.x.stacked = false; // Ensure bars are grouped
    options.scales.y.stacked = false;

  } else {
    // Default for more than 3 columns or unexpected structure
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>Unsupported data structure for bar chart.</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {chartData ? <Bar data={chartData} options={options} /> : null}
    </div>
  );
};

// Component for displaying JSON data as a Pie Chart
const JsonPieChart: React.FC<{ data: any }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>No pie chart data available.</div>;
  }

  const columns = Object.keys(data[0]);

  let chartData;
  let options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title',
      },
    },
  };

  if (columns.length >= 2) {
    // Attempt to find a value column (number) and a label column (string/number)
    const valueColumnIndex = columns.findIndex(_col => typeof data[0][_col] === 'number');
    const labelColumnIndex = columns.findIndex((_, index) => index !== valueColumnIndex);

    if (valueColumnIndex !== -1 && labelColumnIndex !== -1) {
      const valueColumn = columns[valueColumnIndex];
      const labelColumn = columns[labelColumnIndex];

      // Aggregate data by the label column
      const aggregatedData = data.reduce((acc, row) => {
        const label = row[labelColumn];
        const value = row[valueColumn];
        if (acc[label]) {
          acc[label] += value;
        } else {
          acc[label] = value;
        }
        return acc;
      }, {});

      const labels = Object.keys(aggregatedData);
      const values = Object.values(aggregatedData);

      chartData = {
        labels,
        datasets: [
          {
            label: toTitleCase(valueColumn),
            data: values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.3)',
              'rgba(255, 159, 64, 0.3)',
              'rgba(255, 205, 86, 0.3)',
              'rgba(75, 192, 192, 0.3)',
              'rgba(54, 162, 235, 0.3)',
              'rgba(153, 102, 255, 0.3)',
              'rgba(201, 203, 207, 0.3)',
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1,
          },
        ],
      };

      options.plugins.title.text = `${toTitleCase(valueColumn)} Distribution by ${toTitleCase(labelColumn)}`;

    } else {
      return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>Could not identify suitable columns for a pie chart.</div>;
    }
  } else {
     return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>Unsupported data structure for pie chart. Requires at least two columns.</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {chartData ? <Pie data={chartData} options={options} /> : null}
    </div>
  );
};

// Component for displaying JSON data as a Line Chart
const JsonLineChart: React.FC<{ data: any }> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>No line chart data available.</div>;
  }

  const columns = Object.keys(data[0]);

  let chartData;
  let options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'X-axis',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Y-axis',
        },
      },
    },
  };

  if (columns.length === 2) {
    // Simple label-value case
    const labels = data.map(row => Object.values(row)[0]);
    const values = data.map(row => Object.values(row)[1]);

    chartData = {
      labels,
      datasets: [
        {
          label: toTitleCase(columns[1]) || 'Value',
          data: values,
          backgroundColor: [
              'rgba(255, 99, 132, 0.3)',
              'rgba(255, 159, 64, 0.3)',
              'rgba(255, 205, 86, 0.3)',
              'rgba(75, 192, 192, 0.3)',
              'rgba(54, 162, 235, 0.3)',
              'rgba(153, 102, 255, 0.3)',
              'rgba(201, 203, 207, 0.3)',
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1,
          fill: false,
        },
      ],
    };
    options.plugins.title.text = `${toTitleCase(columns[1]) || 'Value'} over ${toTitleCase(columns[0]) || 'Label'}`;
    options.scales.x.title.text = toTitleCase(columns[0]) || 'Label';
    options.scales.y.title.text = toTitleCase(columns[1]) || 'Value';

  } else if (columns.length === 3) {
    // Assuming structure like [Category, OrderedLabel, Value]
    const categoryColumn = columns[0];
    const orderedLabelColumn = columns[1];
    const valueColumn = columns[2];

    // Sort data by the ordered label column
    const sortedData = [...data].sort((a, b) => {
      const labelA = a[orderedLabelColumn];
      const labelB = b[orderedLabelColumn];
      if (typeof labelA === 'number' && typeof labelB === 'number') {
        return labelA - labelB;
      } else if (typeof labelA === 'string' && typeof labelB === 'string') {
        return labelA.localeCompare(labelB);
      } else {
        return 0; // Cannot sort mixed types
      }
    });

    const categories = Array.from(new Set(sortedData.map(row => row[categoryColumn])));
    const labels = Array.from(new Set(sortedData.map(row => row[orderedLabelColumn])));

    chartData = {
      labels,
      datasets: categories.map((category, index) => ({
        label: toTitleCase(category),
        data: labels.map(label => {
          const row = sortedData.find(item => item[categoryColumn] === category && item[orderedLabelColumn] === label);
          return row ? row[valueColumn] : 0;
        }),
        borderColor: `hsl(${(index * 100) % 360}, 70%, 50%)`, // Use HSL for better color variation
        backgroundColor: `hsla(${(index * 100) % 360}, 70%, 50%, 0.5)`,
        fill: false,
        tension: 0.1, // Add some tension for smoother lines
      })),
    };

    options.plugins.title.text = `${toTitleCase(valueColumn)} trend over ${toTitleCase(orderedLabelColumn)} by ${toTitleCase(categoryColumn)}`;
    options.scales.x.title.text = toTitleCase(orderedLabelColumn);
    options.scales.y.title.text = toTitleCase(valueColumn);

  } else {
    // Default for more than 3 columns or unexpected structure
    return <div className="text-muted" style={{ fontSize: 18, opacity: 0.7 }}>Unsupported data structure for line chart.</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {chartData ? <Line data={chartData} options={options} /> : null}
    </div>
  );
};

// Utility function to convert snake_case or camelCase to Title Case
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/[_\-]+/g, ' ') // Replace underscores and dashes with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

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
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      {!isMobile && (
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
              >
                {option.label}
              </button>
            ))}
          </div>
          {/* Dynamic content (tables/charts) */}
          <div style={{ width: '100%', flex: 1, minHeight: 0, background: 'transparent', borderRadius: 0, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-800)', fontSize: 20, fontWeight: 500, opacity: 1, boxShadow: 'none', overflow: viewType === 'table' ? 'auto' : 'hidden' }}>
            {resultData ? (
              viewType === 'table' ? (
                <JsonTable data={resultData} />
              ) : viewType === 'bar' ? (
                <JsonBarChart data={resultData} />
              ) : viewType === 'pie' ? (
                <JsonPieChart data={resultData} />
              ) : viewType === 'line' ? (
                <JsonLineChart data={resultData} />
              ) : (
                <div style={{ color: 'var(--blue-dark)', fontSize: 18, opacity: 0.7 }}>Not implemented yet.</div>
              )
            ) : <span style={{ color: '#b0b3b8', fontWeight: 400, fontSize: 18, opacity: 0.85 }}>Result area (tables or charts)</span>}
          </div>
        </div>
      )}
      {/* Chat on the right */}
      <div style={{ width: isMobile ? '100%' : 420, minWidth: isMobile ? '100%' : 320, maxWidth: isMobile ? '100%' : 480, background: 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '75vh', boxShadow: 'none', borderRadius: 0, border: 'none' }}>
        <div style={{ padding: isMobile ? '1rem' : '2rem 0 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'transparent' }}>
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
                  borderRadius: msg.sender === 'user' ? '20px 20px 20px 20px' : 0, // less rounded for user bubble
                  padding: msg.sender === 'user' ? '12px 22px' : 0,
                  maxWidth: msg.sender === 'user' ? '70%' : '100%', // bot responses use full width
                  minWidth: msg.sender === 'user' ? 0 : '90%', // bot responses use more width
                  wordBreak: 'break-word',
                  fontSize: 15,
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
            minHeight: 48,
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? '100%' : undefined,
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 15,
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
              fontSize: 15,
              marginLeft: 8,
              transition: 'background 0.2s',
              boxShadow: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              minWidth: 80,
              maxWidth: isMobile ? '40%' : undefined,
              width: isMobile ? 'auto' : undefined,
              flexShrink: 0
            }}>
              {loading ? '...' : 'Send'}
            </button>
          </form>
          {/* Responsive fix for mobile input form */}
          <style>{`
            @media (max-width: 600px) {
              .chat-scroll-area + form {
                width: 100% !important;
                max-width: 100% !important;
              }
              .chat-scroll-area + form input[type="text"] {
                min-width: 0 !important;
                width: 1% !important;
              }
              .chat-scroll-area + form button[type="submit"] {
                min-width: 70px !important;
                max-width: 40vw !important;
                width: auto !important;
              }
            }
          `}</style>
          <div style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--gray-400)',
            marginTop: 8,
            fontStyle: 'italic'
          }}>
            Chat can make mistakes. Check important info.
          </div>
          {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
