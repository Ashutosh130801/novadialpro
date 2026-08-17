import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { Button, Card, Badge, Input } from '../common/Button';
import { addCampaign, updateCampaign } from '../../store/slices/campaignSlice';
import type { Campaign, DialMode } from '../../store/slices/campaignSlice';

interface PortHealth {
  id: string;
  portNumber: number;
  status: 'online' | 'offline' | 'warning';
  carrier: string;
  signalStrength: number; // 0-5
  simBalance?: number;
  callsToday: number;
  lastReboot?: number;
}

export const SIMPortManager: React.FC = () => {
  const dispatch = useDispatch();
  const { gateways } = useSelector((state: RootState) => state.gateway);
  
  const [rotationPolicy, setRotationPolicy] = useState<'round-robin' | 'least-used' | 'prefix-match'>('round-robin');
  const [showUSSD, setShowUSSD] = useState(false);
  const [ussdCommand, setUssdCommand] = useState('');
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  
  // Mock port data
  const mockPorts: PortHealth[] = [
    { id: '1', portNumber: 1, status: 'online', carrier: 'AT&T', signalStrength: 5, simBalance: 45.20, callsToday: 23 },
    { id: '2', portNumber: 2, status: 'online', carrier: 'Verizon', signalStrength: 4, simBalance: 32.50, callsToday: 18 },
    { id: '3', portNumber: 3, status: 'warning', carrier: 'T-Mobile', signalStrength: 2, simBalance: 8.75, callsToday: 31 },
    { id: '4', portNumber: 4, status: 'online', carrier: 'AT&T', signalStrength: 5, simBalance: 67.00, callsToday: 15 },
    { id: '5', portNumber: 5, status: 'offline', carrier: 'Unknown', signalStrength: 0, callsToday: 0 },
    { id: '6', portNumber: 6, status: 'online', carrier: 'Verizon', signalStrength: 4, simBalance: 28.90, callsToday: 27 },
    { id: '7', portNumber: 7, status: 'online', carrier: 'T-Mobile', signalStrength: 3, simBalance: 15.40, callsToday: 12 },
    { id: '8', portNumber: 8, status: 'online', carrier: 'AT&T', signalStrength: 5, simBalance: 52.30, callsToday: 19 },
  ];
  
  const getSignalBars = (strength: number) => {
    return '▂▃▄▅▆'.slice(0, strength) + '░'.repeat(5 - strength);
  };
  
  const handleRebootPort = (portId: string) => {
    alert(`Rebooting port ${portId}...`);
    // In real app: call API to reboot port
  };
  
  const handleSendUSSD = () => {
    if (!selectedPort || !ussdCommand) return;
    alert(`Sending USSD ${ussdCommand} to port ${selectedPort}...`);
    // In real app: call Dinstar USSD API
    setShowUSSD(false);
    setUssdCommand('');
  };
  
  const handleSetRotationPolicy = () => {
    // Update campaign with rotation policy
    alert(`Rotation policy set to: ${rotationPolicy}`);
  };
  
  const onlineCount = mockPorts.filter(p => p.status === 'online').length;
  const warningCount = mockPorts.filter(p => p.status === 'warning').length;
  const offlineCount = mockPorts.filter(p => p.status === 'offline').length;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-white">{mockPorts.length}</p>
          <p className="text-sm text-gray-400">Total Ports</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-400">{onlineCount}</p>
          <p className="text-sm text-gray-400">Online</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-amber-400">{warningCount}</p>
          <p className="text-sm text-gray-400">Warning</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-red-400">{offlineCount}</p>
          <p className="text-sm text-gray-400">Offline</p>
        </Card>
      </div>
      
      {/* Rotation Policy */}
      <Card title="SIM Rotation Policy" subtitle="Configure automatic SIM selection">
        <div className="flex items-center gap-4">
          <select
            value={rotationPolicy}
            onChange={(e) => setRotationPolicy(e.target.value as any)}
            className="input flex-1"
          >
            <option value="round-robin">Round Robin</option>
            <option value="least-used">Least Used</option>
            <option value="prefix-match">Prefix Match</option>
          </select>
          <Button variant="primary" onClick={handleSetRotationPolicy}>
            Apply Policy
          </Button>
          <Button variant="secondary" onClick={() => setShowUSSD(true)}>
            📱 Send USSD
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong>Current Policy:</strong> {rotationPolicy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This policy determines which SIM port is selected for outbound calls when multiple ports are available.
          </p>
        </div>
      </Card>
      
      {/* Port Grid */}
      <Card title="SIM Port Status" subtitle="Real-time monitoring of all gateway ports">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockPorts.map((port) => (
            <div
              key={port.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedPort === port.id
                  ? 'bg-violet-500/20 border-violet-500'
                  : port.status === 'online'
                  ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                  : port.status === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
              }`}
              onClick={() => setSelectedPort(port.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-white">Port {port.portNumber}</span>
                <div className={`w-2 h-2 rounded-full ${
                  port.status === 'online' ? 'bg-green-500' :
                  port.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
              </div>
              
              <p className="text-sm text-gray-300 mb-2">{port.carrier}</p>
              
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">Signal: {getSignalBars(port.signalStrength)}</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < port.signalStrength
                          ? port.signalStrength >= 4 ? 'bg-green-500' : port.signalStrength >= 2 ? 'bg-amber-500' : 'bg-red-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Calls Today:</span>
                  <span className="text-white">{port.callsToday}</span>
                </div>
                {port.simBalance !== undefined && (
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="text-green-400">${port.simBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {port.status === 'online' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRebootPort(port.id);
                  }}
                  className="mt-3 w-full py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition-all"
                >
                  🔄 Reboot
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
      
      {/* Alerts */}
      <Card title="Active Alerts" subtitle="Recent notifications">
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <span className="text-amber-400">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-white">Low signal on Port 3</p>
              <p className="text-xs text-gray-400">Signal strength dropped to 2 bars</p>
            </div>
            <Badge variant="warning" size="sm">5m ago</Badge>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <span className="text-red-400">🚨</span>
            <div className="flex-1">
              <p className="text-sm text-white">Port 5 offline</p>
              <p className="text-xs text-gray-400">No response from gateway</p>
            </div>
            <Badge variant="danger" size="sm">12m ago</Badge>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <span className="text-cyan-400">💰</span>
            <div className="flex-1">
              <p className="text-sm text-white">Low balance alert - Port 3</p>
              <p className="text-xs text-gray-400">SIM balance below $10</p>
            </div>
            <Badge variant="info" size="sm">1h ago</Badge>
          </div>
        </div>
      </Card>
      
      {/* USSD Modal */}
      {showUSSD && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Send USSD Command</h3>
            <p className="text-sm text-gray-400 mb-4">
              Select a port and enter a USSD code (e.g., *123# for balance check)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Port</label>
                <select
                  value={selectedPort || ''}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a port...</option>
                  {mockPorts.filter(p => p.status === 'online').map((port) => (
                    <option key={port.id} value={port.id}>
                      Port {port.portNumber} - {port.carrier}
                    </option>
                  ))}
                </select>
              </div>
              
              <Input
                label="USSD Code"
                placeholder="*123#"
                value={ussdCommand}
                onChange={(e) => setUssdCommand(e.target.value)}
              />
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowUSSD(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSendUSSD} className="flex-1">
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
