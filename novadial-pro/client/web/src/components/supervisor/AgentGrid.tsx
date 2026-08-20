import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { Button, Card, Badge, Avatar } from '../common/Button';
import { setStatus } from '../../store/slices/agentSlice';

interface AgentGridItem {
  id: string;
  name: string;
  avatar?: string;
  status: 'available' | 'in-call' | 'wrap-up' | 'paused' | 'offline';
  currentCall?: {
    duration: number;
    leadName: string;
  };
  campaign?: string;
  todayStats: {
    calls: number;
    talkTime: number;
    conversions: number;
  };
}

export const AgentGrid: React.FC = () => {
  const dispatch = useDispatch();
  const { agents } = useSelector((state: RootState) => state.agent);
  const [filter, setFilter] = useState<'all' | 'available' | 'in-call' | 'paused'>('all');
  
  // Mock data for demo
  const mockAgents: AgentGridItem[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      status: 'in-call',
      currentCall: { duration: 245, leadName: 'John Smith - Acme Corp' },
      campaign: 'Q4 Outbound',
      todayStats: { calls: 45, talkTime: 10800, conversions: 3 },
    },
    {
      id: '2',
      name: 'Mike Chen',
      status: 'available',
      campaign: 'Q4 Outbound',
      todayStats: { calls: 38, talkTime: 9200, conversions: 2 },
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      status: 'wrap-up',
      campaign: 'Customer Retention',
      todayStats: { calls: 52, talkTime: 12400, conversions: 5 },
    },
    {
      id: '4',
      name: 'David Kim',
      status: 'paused',
      campaign: 'Q4 Outbound',
      todayStats: { calls: 28, talkTime: 6800, conversions: 1 },
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      status: 'in-call',
      currentCall: { duration: 120, leadName: 'Robert Brown - TechStart' },
      campaign: 'New Product Launch',
      todayStats: { calls: 41, talkTime: 9800, conversions: 4 },
    },
    {
      id: '6',
      name: 'James Wilson',
      status: 'offline',
      campaign: 'Q4 Outbound',
      todayStats: { calls: 0, talkTime: 0, conversions: 0 },
    },
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'in-call': return 'bg-blue-500';
      case 'wrap-up': return 'bg-amber-500';
      case 'paused': return 'bg-gray-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'in-call': return 'On Call';
      case 'wrap-up': return 'Wrap-up';
      case 'paused': return 'Paused';
      case 'offline': return 'Offline';
      default: return status;
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const filteredAgents = mockAgents.filter(agent => {
    if (filter === 'all') return true;
    return agent.status === filter;
  });
  
  return (
    <Card title="Agent Grid" subtitle={`Showing ${filteredAgents.length} agents`}>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'available', 'in-call', 'paused'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={agent.name} src={agent.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{agent.name}</p>
                <p className="text-xs text-gray-400">{agent.campaign || 'No campaign'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                <span className="text-xs text-gray-400">{getStatusLabel(agent.status)}</span>
              </div>
            </div>
            
            {/* Current Call */}
            {agent.currentCall && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-300 mb-1">📞 On call with:</p>
                <p className="text-sm text-white font-medium">{agent.currentCall.leadName}</p>
                <p className="text-xs text-gray-400 mt-1">Duration: {formatDuration(agent.currentCall.duration)}</p>
              </div>
            )}
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center bg-white/5 rounded-lg p-2">
                <p className="text-lg font-bold text-white">{agent.todayStats.calls}</p>
                <p className="text-xs text-gray-400">Calls</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-2">
                <p className="text-lg font-bold text-white">{Math.round(agent.todayStats.talkTime / 60)}</p>
                <p className="text-xs text-gray-400">Talk (min)</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-2">
                <p className="text-lg font-bold text-green-400">{agent.todayStats.conversions}</p>
                <p className="text-xs text-gray-400">Sales</p>
              </div>
            </div>
            
            {/* Actions */}
            {agent.status !== 'offline' && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 text-xs">
                  👂 Listen
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 text-xs">
                  💬 Whisper
                </Button>
                {agent.status === 'in-call' && (
                  <Button variant="danger" size="sm" className="flex-1 text-xs">
                    🎯 Barge
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
