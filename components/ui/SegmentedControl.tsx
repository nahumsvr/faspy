import React from 'react';

export interface SegmentedControlOption<T extends string = string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) => {
  return (
    <div
      className={`inline-flex items-center p-1 bg-gray-900/90 backdrop-blur-md rounded-full border border-gray-800 shadow-inner overflow-hidden ${className}`}
      role="group"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`font-sans relative z-10 text-sm font-semibold px-5 py-1.5 rounded-full transition-all duration-300 ease-in-out ${
              isSelected
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
