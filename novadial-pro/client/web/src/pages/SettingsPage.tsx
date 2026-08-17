import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { sipAccounts } = useSelector((state: RootState) => state.auth);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-gray-400">Configure your account and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SIP Accounts */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">SIP Accounts</h3>
          {sipAccounts.length > 0 ? (
            <div className="space-y-3">
              {sipAccounts.map((account) => (
                <div key={account.id} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-400">{account.username}@{account.domain}</p>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No SIP accounts configured.</p>
          )}
        </div>
        
        {/* User Profile */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input type="text" defaultValue={user?.name} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" defaultValue={user?.email} className="input" disabled />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <input type="text" defaultValue={user?.role} className="input" disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
