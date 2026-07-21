import React from 'react';
import { SharedAudioRenderer } from './SharedAudioRenderer';
import { type MockTaskRendererProps } from './index';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DescribeImageRenderer(props: MockTaskRendererProps) {
  const { question } = props;

  let spec: any = null;
  try {
    const payload = JSON.parse(question.optionsJson || '{}');
    spec = payload.chartSpecification;
  } catch (e) {}

  let customImageNode: React.ReactNode = null;

  if (spec) {
    const data = spec.labels.map((label: string, i: number) => {
      const point: any = { name: label };
      spec.series.forEach((s: any) => {
        point[s.name] = s.values[i];
      });
      return point;
    });

    if (spec.chartType === 'bar') {
      customImageNode = (
        <div className="w-full flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">{spec.title}</h3>
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
        </div>
      );
    } else if (spec.chartType === 'line') {
      customImageNode = (
        <div className="w-full flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">{spec.title}</h3>
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
        </div>
      );
    } else {
      customImageNode = <div className="text-gray-400 text-sm">Unsupported chart type: {spec.chartType}</div>;
    }
  }

  return SharedAudioRenderer(props, {}, { showPassage: false, showImage: true, customImageNode });
}
