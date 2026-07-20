import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import type { RendererProps } from '../types';

export const ROPRenderer: React.FC<RendererProps> = ({ item, status, onAnswerChange, currentResponse }) => {
  const [order, setOrder] = useState<string[]>(() => currentResponse?.reorderedList ?? (item.options ? [...item.options] : []));

  useEffect(() => {
    onAnswerChange({ reorderedList: order.length > 0 ? order : null });
  }, [order]);

  useEffect(() => {
    setOrder(currentResponse?.reorderedList ?? (item.options ? [...item.options] : []));
  }, [item.id]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (status === 'completed' || status === 'submitted') return;
    const newList = [...order];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setOrder(newList);
    }
  };

  const disabled = status === 'completed' || status === 'submitted';

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
        <GripVertical className="h-3.5 w-3.5" />
        Arrange the paragraphs into the correct order
      </p>
      {order.map((text, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm leading-relaxed transition-all ${
            disabled ? 'opacity-75' : 'bg-dark-surface border-dark-border'
          }`}
        >
          <span className="flex items-center justify-center h-6 w-6 rounded-md bg-dark-elevated text-[11px] font-mono font-bold text-gray-500 shrink-0">
            {index + 1}
          </span>
          <span className="flex-1">{text}</span>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              disabled={index === 0 || disabled}
              onClick={() => moveItem(index, 'up')}
              className="h-7 w-7 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center justify-center text-gray-500 hover:text-primary-400 hover:border-primary-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={index === order.length - 1 || disabled}
              onClick={() => moveItem(index, 'down')}
              className="h-7 w-7 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center justify-center text-gray-500 hover:text-primary-400 hover:border-primary-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
