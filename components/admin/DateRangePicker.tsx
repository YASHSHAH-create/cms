'use client';

import React from 'react';

interface DateRangePickerProps {
  value: "7d" | "30d" | "90d";
  onChange: (value: "7d" | "30d" | "90d") => void;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const options = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" }
  ] as const;

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === option.value
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
