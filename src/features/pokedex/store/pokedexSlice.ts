import type { StateCreator } from 'zustand';

export interface PokedexSlice {
  query: string;
  typeFilters: string[];
  setQuery: (query: string) => void;
  toggleType: (type: string) => void;
  clearFilters: () => void;
}

export const createPokedexSlice: StateCreator<PokedexSlice, [], [], PokedexSlice> = (set, get) => ({
  query: '',
  typeFilters: [],

  setQuery: (query) => set({ query }),

  toggleType: (type) => {
    const active = get().typeFilters;
    set({
      typeFilters: active.includes(type) ? active.filter((item) => item !== type) : [...active, type],
    });
  },

  clearFilters: () => set({ query: '', typeFilters: [] }),
});
