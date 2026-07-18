import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const ROPRenderer: React.FC<RendererProps> = ({ item, status, theme, onAnswerChange }) => {
  const [order, setOrder] = useState<string[]>(() => item.options ? [...item.options] : []);

  useEffect(() => {
    onAnswerChange({ reorderedList: order.length > 0 ? order : null });
  }, [order]);

  useEffect(() => {
    if (item.options) setOrder([...item.options]);
  }, [item.id]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (status === 'completed') return;
    const newList = [...order];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setOrder(newList);
    }
  };

  return (
    <div className="space-y-3">
      {order.map((text, index) => (
        <div
          key={index}
          className={`p-4 rounded-xl border flex justify-between items-center text-xs leading-relaxed ${
            theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <span className="flex-1 pr-4">{text}</span>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              disabled={index === 0 || status === 'completed'}
              onClick={() => moveItem(index, 'up')}
              className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30 cursor-pointer"
            >
              ▲ Move Up
            </button>
            <button
              disabled={index === order.length - 1 || status === 'completed'}
              onClick={() => moveItem(index, 'down')}
              className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30 cursor-pointer"
            >
              ▼ Move Down
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
