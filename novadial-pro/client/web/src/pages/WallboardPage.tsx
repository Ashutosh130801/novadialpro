import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const WallboardPage: React.FC = () => {
  const { metrics, agents } = useSelector((state: RootState) => state.agent);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold">Realtime Wallboard</h2>
        <p className="text-sm text-gray-400">Monitor team performance</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Calls', value: metrics.activeCalls },
          { label: 'Calls/Hour', value: metrics.callsPerHour },
          { label: 'Connect Rate', value: `${metrics.connectRate}%` },
          { label: 'Avg Talk Time', value: `${Math.floor(metrics.avgTalkTime / 60)}m` },
          { label: 'Abandon Rate', value: `${metrics.abandonRate}%` },
          { label: 'Agents Online', value: metrics.agentsOnline },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-4 text-center">
            <p className="text-3xl font-bold text-cyan-400">{kpi.value}</p>
            <p className="text-sm text-gray-400">{kpi.label}</p>
          </div>
        ))}
      </div>
      
      {/* Agent Grid */}
      <div className="flex-1 glass-card p-4 overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Agent Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-xs text-gray-400">{agent.extension}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                agent.status === 'available' ? 'bg-green-500/20 text-green-400' :
                agent.status === 'in-call' ? 'bg-blue-500/20 text-blue-400' :
                agent.status === 'wrap-up' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
