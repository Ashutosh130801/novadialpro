import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const CampaignsPage: React.FC = () => {
  const { campaigns } = useSelector((state: RootState) => state.campaign);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold">Campaigns</h2>
        <p className="text-sm text-gray-400">Manage your outbound campaigns</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{campaign.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Dial Mode</span>
                  <span>{campaign.dialMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Leads</span>
                  <span>{campaign.stats.totalLeads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Connect Rate</span>
                  <span>{campaign.stats.connectRate}%</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full glass-card p-12 text-center text-gray-400">
            <p>No campaigns yet. Create your first campaign to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
