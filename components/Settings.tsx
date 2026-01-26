
import React from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
  }));

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="glass-morphism rounded-3xl p-6 md:p-8 w-full max-w-2xl mx-auto space-y-8 shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Scheduler Configuration</h2>
        <button
          onClick={() => handleChange('isEnabled', !settings.isEnabled)}
          className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
            settings.isEnabled 
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' 
            : 'bg-slate-700 text-slate-400'
          }`}
        >
          {settings.isEnabled ? 'Scheduler Active' : 'Scheduler Off'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Active Range</label>
          <div className="flex items-center space-x-3">
            <select
              value={settings.startHour}
              onChange={(e) => handleChange('startHour', parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 flex-1"
            >
              {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
            <span className="text-slate-500">to</span>
            <select
              value={settings.endHour}
              onChange={(e) => handleChange('endHour', parseInt(e.target.value))}
              className="bg-slate-800 text-slate-200 rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 flex-1"
            >
              {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-500">Songs will only play during this window.</p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Master Volume</label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume}
              onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-slate-200 w-8 font-mono">{Math.round(settings.volume * 100)}%</span>
          </div>
          <p className="text-xs text-slate-500">Applies to bells, voice, and music.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
