import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const HistoryPage: React.FC = () => {
  const { history } = useSelector((state: RootState) => state.contact);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold">Call History</h2>
        <p className="text-sm text-gray-400">View all your past calls</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((call) => (
              <div key={call.id} className="glass-card p-4 flex items-center gap-4">
                <span className={`text-2xl ${
                  call.direction === 'inbound' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {call.direction === 'inbound' ? '←' : '→'}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{call.phoneNumber}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(call.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    call.status === 'answered' ? 'bg-green-500/20 text-green-400' :
                    call.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {call.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-gray-400">
            <p>No call history yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
