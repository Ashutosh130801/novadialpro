import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  avatar?: string;
  tags: string[];
  isFavorite: boolean;
  notes?: string;
  customFields: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface CallHistoryEntry {
  id: string;
  contactId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'answered' | 'missed' | 'voicemail' | 'busy' | 'failed';
  duration: number;
  startTime: number;
  endTime?: number;
  recording?: string;
  notes?: string;
  disposition?: string;
}

interface ContactState {
  contacts: Contact[];
  favorites: Contact[];
  history: CallHistoryEntry[];
  selectedContact: Contact | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  blacklist: string[]; // DNC numbers
}

const initialState: ContactState = {
  contacts: [],
  favorites: [],
  history: [],
  selectedContact: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  blacklist: [],
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    setContacts(state, action: PayloadAction<Contact[]>) {
      state.contacts = action.payload;
      state.favorites = action.payload.filter((c) => c.isFavorite);
    },
    addContact(state, action: PayloadAction<Contact>) {
      state.contacts.push(action.payload);
      if (action.payload.isFavorite) {
        state.favorites.push(action.payload);
      }
    },
    updateContact(state, action: PayloadAction<Contact>) {
      const index = state.contacts.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.contacts[index] = action.payload;
        // Update favorites if needed
        state.favorites = state.contacts.filter((c) => c.isFavorite);
      }
    },
    deleteContact(state, action: PayloadAction<string>) {
      state.contacts = state.contacts.filter((c) => c.id !== action.payload);
      state.favorites = state.favorites.filter((c) => c.id !== action.payload);
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const contact = state.contacts.find((c) => c.id === action.payload);
      if (contact) {
        contact.isFavorite = !contact.isFavorite;
        state.favorites = state.contacts.filter((c) => c.isFavorite);
      }
    },
    setSelectedContact(state, action: PayloadAction<Contact | null>) {
      state.selectedContact = action.payload;
    },
    setHistory(state, action: PayloadAction<CallHistoryEntry[]>) {
      state.history = action.payload;
    },
    addHistoryEntry(state, action: PayloadAction<CallHistoryEntry>) {
      state.history.unshift(action.payload);
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    addToBlacklist(state, action: PayloadAction<string>) {
      if (!state.blacklist.includes(action.payload)) {
        state.blacklist.push(action.payload);
      }
    },
    removeFromBlacklist(state, action: PayloadAction<string>) {
      state.blacklist = state.blacklist.filter(
        (num) => num !== action.payload
      );
    },
    importContacts(state, action: PayloadAction<Contact[]>) {
      // Deduplicate by phone number
      const existingPhones = new Set(
        state.contacts.map((c) => c.phone)
      );
      const newContacts = action.payload.filter(
        (c) => !existingPhones.has(c.phone)
      );
      state.contacts = [...state.contacts, ...newContacts];
      state.favorites = state.contacts.filter((c) => c.isFavorite);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  setSelectedContact,
  setHistory,
  addHistoryEntry,
  setSearchQuery,
  addToBlacklist,
  removeFromBlacklist,
  importContacts,
  setLoading,
  setError,
} = contactSlice.actions;

export default contactSlice.reducer;
