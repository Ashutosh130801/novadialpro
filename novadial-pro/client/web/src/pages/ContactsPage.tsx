import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const ContactsPage: React.FC = () => {
  const { contacts, favorites } = useSelector((state: RootState) => state.contact);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="glass-card p-4">
        <h2 className="text-xl font-bold">Contacts</h2>
        <p className="text-sm text-gray-400">Manage your contacts and favorites</p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="glass-card p-4 mb-4">
          <input type="text" placeholder="Search contacts..." className="input" />
        </div>
        
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500" />
                <div className="flex-1">
                  <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                  <p className="text-sm text-gray-400">{contact.phone}</p>
                </div>
                <button className="text-gray-400 hover:text-yellow-400">
                  {contact.isFavorite ? '★' : '☆'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-gray-400">
            <p>No contacts yet. Import or add your first contact.</p>
          </div>
        )}
      </div>
    </div>
  );
};
