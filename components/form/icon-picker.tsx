
'use client';

import { useState } from 'react';
import * as MdIcons from 'react-icons/md';
import type { IconType } from 'react-icons';
import { Search, ChevronDown } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'Pilih Icon (Material Design)' }: IconPickerProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const iconMap = MdIcons as Record<string, IconType>;

  // Filter icons based on search
  const iconList = Object.keys(MdIcons)
    .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100); // Limit to 100 icons for performance

  const SelectedIcon = iconMap[value] || MdIcons.MdHelpOutline;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-green-600">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-700">{value || 'Pilih Icon'}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-h-[300px] overflow-hidden flex flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari icon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-6 gap-2 overflow-y-auto pr-2">
              {iconList.map((iconName) => {
                const Icon = iconMap[iconName];
                if (!Icon) return null;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onChange(iconName);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-green-50 transition-colors ${value === iconName ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1' : 'text-gray-600'}`}
                    title={iconName}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
              {iconList.length === 0 && (
                <div className="col-span-6 text-center py-4 text-gray-500 text-sm">
                  Tidak ada icon ditemukan.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {isOpen && (
        <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
