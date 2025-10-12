import { create } from "zustand"
import { persist } from "zustand/middleware"

const useThemeStore = create(
    persist(
        (set) => ({
            theme: "dark",
            setTheme: (theme) => set({ theme }),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === "dark" ? "light" : "dark"
                }))
        }),
        {
            name: "theme-storage", // storage key
            getStorage: () => localStorage
        }

    )
)

export default useThemeStore;
