
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-8">
      <div className="text-6xl md:text-8xl font-thin tracking-tighter text-sky-400 tabular-nums">
        {formatTime(time).split(' ')[0]}
        <span className="text-3xl md:text-4xl font-light ml-2 uppercase text-slate-400">
          {formatTime(time).split(' ')[1]}
        </span>
      </div>
      <div className="text-slate-400 text-lg md:text-xl font-medium uppercase tracking-[0.2em]">
        {formatDate(time)}
      </div>
    </div>
  );
};

export default Clock;
