import React from 'react';
import { Mic, MicOff, CheckCircle2, ImageIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RendererProps } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DIRenderer: React.FC<RendererProps> = ({ item, status }) => {
  const isRecording = status === 'recording';
  const isSubmitted = status === 'submitted' || status === 'completed';

  // Parse payload for chart specification
  let payload: any = {};
  try {
    payload = JSON.parse(item.taskPayloadJson || '{}');
  } catch (e) {}

  const spec = payload.chartSpecification;

  const renderChart = () => {
    if (!spec) return null;
    
    // Transform series data into recharts format
    const data = spec.labels.map((label: string, i: number) => {
      const point: any = { name: label };
      spec.series.forEach((s: any) => {
        point[s.name] = s.values[i];
      });
      return point;
    });

    if (spec.chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} itemStyle={{ color: '#f3f4f6' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {spec.series.map((s: any, idx: number) => (
              <Bar key={s.name} dataKey={s.name} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (spec.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }} />
            <Legend />
            {spec.series.map((s: any, idx: number) => (
              <Line type="monotone" key={s.name} dataKey={s.name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Fallback for pie/table...
    return <div className="text-gray-400 text-sm">Unsupported chart type: {spec.chartType}</div>;
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="rounded-2xl border border-dark-border bg-dark-surface-50 overflow-hidden max-w-2xl w-full p-4">
          {spec ? (
            <div className="flex flex-col items-center w-full">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">{spec.title}</h3>
              {renderChart()}
            </div>
          ) : item.imageUrl ? (
            <img
              referrerPolicy="no-referrer"
              src={item.imageUrl}
              alt={item.title}
              className="w-full max-h-72 object-contain p-4"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mb-2" />
              <span className="text-xs">No image available</span>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-2xl border p-8 text-center transition-all duration-300 ${
        isRecording
          ? 'border-primary-500/40 bg-primary-500/5 shadow-lg shadow-primary-500/5'
          : isSubmitted
            ? 'border-success-500/30 bg-success-500/5'
            : 'border-dark-border bg-dark-surface'
      }`}>
        <div className="flex justify-center mb-5">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/30'
              : isSubmitted
                ? 'bg-success-500/10 text-success-400'
                : 'bg-dark-elevated text-gray-500'
          }`}>
            {isRecording ? (
              <Mic className="h-8 w-8 animate-pulse" />
            ) : isSubmitted ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <MicOff className="h-8 w-8" />
            )}
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-100 mb-2">
          {isRecording && 'Recording... Describe the image in detail'}
          {isSubmitted && 'Voice response captured'}
          {!isRecording && !isSubmitted && 'Study the image carefully'}
        </p>

        <p className="text-xs text-gray-500">
          {isRecording && 'Describe key trends, data points, and your conclusions'}
          {isSubmitted && 'Response stored. Click Submit to continue'}
          {!isRecording && !isSubmitted && 'Use preparation time to analyze the chart or diagram'}
        </p>
      </div>
    </div>
  );
};
