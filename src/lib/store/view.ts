import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewType = 'grid' | 'table';

export type ViewStore = {
  files: ViewType;
  urls: ViewType;
  users: ViewType;
  invites: ViewType;
  folders: ViewType;

  setView: (type: Exclude<keyof ViewStore, 'setView'>, value: ViewType) => void;
};

export const useViewStore = create<ViewStore>()(
  persist(
    (set) => ({
      files: 'grid',
      urls: 'table',
      users: 'table',
      invites: 'table',
      folders: 'table',

      setView: (type, value) =>
        set((state) => ({
          ...state,
          [type]: value,
        })),
    }),
    {
      name: 'skycloud-view-settings',
    },
  ),
);
