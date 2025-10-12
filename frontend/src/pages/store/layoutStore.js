import { create } from "zustand"
import { persist } from "zustand/middleware"

const useLayoutStore = create(
    persist(
        (set) => ({
            activeTab: "chats",
            setActiveTab: (tab) => set({ activeTab: tab }),
            selectedContact: null,
            setSelectedContact: (contact) => set({ selectedContact: contact }),
        }),
        {
            name: "layout-storage", // storage key
            getStorage: () => localStorage
        }

    )
)

export default useLayoutStore;
