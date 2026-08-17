import React from 'react';
import { Card, Badge } from '../common/Button';

interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: 'violet' | 'cyan' | 'green' | 'amber' | 'red';
}

export const WallboardMetrics: React.FC = () => {
  const kpis: KPICard[] = [
    { title: 'Active Calls', value: 47, change: 12, icon: '📞', color: 'cyan' },
    { title: 'Calls/Hour', value: 312, change: 8, icon: '⏱️', color: 'violet' },
    { title: 'Connect Rate', value: '28.5%', change: -2.3, icon: '🎯', color: 'green' },
    { title: 'Avg Talk Time', value: '4:32', change: 15, icon: '💬', color: 'amber' },
    { title: 'Abandon Rate', value: '2.1%', change: -0.5, icon: '📉', color: 'red' },
    { title: 'Agents Online', value: 24, change: 0, icon: '👥', color: 'violet' },
  ];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      violet: 'from-violet-500 to-purple-500',
      cyan: 'from-cyan-500 to-blue-500',
      green: 'from-green-500 to-emerald-500',
      amber: 'from-amber-500 to-orange-500',
      red: 'from-red-500 to-rose-500',
    };
    return colors[color] || colors.violet;
  };

  // Mock chart data
  const callsPerHour = [45, 62, 78, 95, 112, 98, 85, 72, 89, 105, 125, 142];
  const maxCall = Math.max(...callsPerHour);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="text-center">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getColorClass(kpi.color)} flex items-center justify-center text-2xl mx-auto mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-sm text-gray-400">{kpi.title}</p>
            {kpi.change !== undefined && (
              <p className={`text-xs mt-1 ${kpi.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Per Hour Chart */}
        <Card title="Calls Per Hour" subtitle="Last 12 hours">
          <div className="h-48 flex items-end justify-between gap-2 mt-4">
            {callsPerHour.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-violet-600 to-cyan-500 rounded-t transition-all hover:opacity-80"
                  style={{ height: `${(value / maxCall) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">{i + 8}:00</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Campaign Performance */}
        <Card title="Campaign Performance" subtitle="By campaign">
          <div className="space-y-4 mt-4">
            {[
              { name: 'Q4 Outbound', calls: 1245, connected: 354, rate: 28.4 },
              { name: 'Customer Retention', calls: 892, connected: 312, rate: 35.0 },
              { name: 'New Product Launch', calls: 567, connected: 145, rate: 25.6 },
              { name: 'Survey Campaign', calls: 234, connected: 89, rate: 38.0 },
            ].map((campaign) => (
              <div key={campaign.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white">{campaign.name}</span>
                    <span className="text-sm text-gray-400">{campaign.calls} calls</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                      style={{ width: `${campaign.rate}%` }}
                    />
                  </div>
                </div>
                <Badge variant="info" size="sm">{campaign.rate}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SIM Ports Summary */}
      <Card title="Live SIM Ports" subtitle="Gateway health overview">
        <div className="grid grid-cols-8 gap-2">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                i === 4 || i === 11
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : i === 7
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              P{i + 1}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
            <span>Offline</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
