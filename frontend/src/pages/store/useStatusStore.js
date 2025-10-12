import { create } from "zustand"
import { getSocket } from "../services/chat.services"
import axiosInstance from "../services/url.services"
import useUserStore from "../store/useUserStore"



const useStatusStore = create((set, get) => ({

    // state
    statuses: [],
    loading: false,
    error: null,

    // Active
    setStatuses: (statuses) => set({ statuses }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),



    // Initialize the socket Listeneres
    initializeSocket: () => {
        // const { user } = useUserStore().getState()
        const { user } = useUserStore.getState()

        const socket = getSocket(user?._id)
        if (!socket) return;


        // realtime status events

        // realtime adds status events
        socket.on("new_status", (newStatus) => {
            set((state) => ({
                statuses: state.statuses.some((s) => s._id === newStatus._id)
                    ? state.statuses : [newStatus, ...state.statuses]
            }))
        })

        // realtime status deleted events
        socket.on("status_deleted", (newStatus) => {
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== newStatus)
            }))
        })


        // realtime status viewed updating
        socket.on("status_viewed", (statusId, viewers) => {
            set((state) => ({
                statuses: state.statuses.map((status) =>
                    status._id === statusId ? { ...status, viewers } : status
                ),
            }))
        })

    },

    cleanupSocket: (userId) => {
        const socket = getSocket(userId)
        if (socket) {
            socket.off("new_status")
            socket.off("status_deleted")
            socket.off("status_viewed")
        }
    },

    // fetching status
    fetchStatus: async () => {
        set({ loading: true, error: null })
        try {

            const { data } = await axiosInstance.get("/status")
            set({ statuses: data.data || [], loading: false })

        } catch (error) {
            console.log(`Error fetching status`, error);
            set({ error: error.message, loading: false });
        }
    },


    // creating status
    creatingStatus: async (statusData) => {
        set({ loading: true, error: null })
        try {
            const formData = new FormData()

            if (statusData.file) {
                formData.append("media", statusData.file);
            }


            if (statusData.content?.trim()) {
                formData.append("content", statusData.content);
            }

            const { data } = await axiosInstance.post("/status", formData,
                { headers: { "Content-Type": "multipart/form-data" } });

            console.log(data);

            // add to status to local status
            if (data?.data) {
                set((state) => ({
                    statuses: state.statuses.some((s) => s._id === data.data._id)
                        ? state.statuses : [data.data, ...state.statuses],
                }))
            }
            set({ loading: false })
            return data.data;
        } catch (error) {
            console.log(`Error creating users status`, error);
            set({ error: error.message, loading: false });
            throw Error;
        }
    },


    viewStatus: async (statusId) => {
        set({ loading: true, error: null })
        try {
            await axiosInstance.put(`/status/${statusId}/view`)
            set((state) => ({
                statuses: state.statuses.map((status) =>
                    status._id === statusId ? { ...status } : status
                ),

            }))
            set({ loading: false })
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },





    deleteStatus: async (statusId) => {
        set({ loading: true, error: null })
        try {
            await axiosInstance.delete(`/status/${statusId}`)
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId)
            }))
            set({ loading: false })
        } catch (error) {
            console.log(`Error deleting status`, error);
            set({ error: error.message, loading: false });
            throw Error;
        }
    },

    // get status viewers
    getStatusViewers: async (statusId) => {
        set({ loading: true, error: null })
        try {
            const { data } = await axiosInstance.get(`/status/${statusId}/viewers`)
            set({ loading: false })
            return data.data;
        } catch (error) {
            console.log(`Error getting  status viewers`, error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },


    // helper function for
    // getGroupedStatus: () => {
    //     const { statuses } = get();
    //     if (!Array.isArray(statuses)) return {};   // ✅ avoid crash if not array
    //     return statuses.reduce((acc, status) => {
    //         const userId = status.user?._id || status.user;
    //         if (!acc[userId]) {
    //             acc[userId] = {
    //                 id: userId,
    //                 // name: status.user?.name || "Unknown",
    //                 name: status?.user?.username,
    //                 avatar: status?.user?.profilePicture,
    //                 statuses: []
    //             };
    //         }
    //         acc[userId].statuses.push(status);
    //         return acc;
    //     }, {});
    // },






    // // helper function for
    // getGroupedStatus: () => {
    //     const { statuses } = get();
    //     const grouped = statuses.reduce((acc, status) => {
    //         const statusUserId = status.user?._id;
    //         if (!acc[statusUserId]) {
    //             acc[statusUserId] = {
    //                 id: statusUserId,
    //                 name: status?.user?.username,
    //                 avatar: status?.user?.profilePicture,
    //                 statuses: []
    //             }
    //         }
    //         acc[statusUserId].statuses.push({
    //             id: status._id,
    //             media: status.content,
    //             contentType: status.contentType,
    //             timeStamp: status.createdAt,
    //             viewers: status.viewers,
    //         });
    //         return acc;
    //     }, {});
    //     return Object.values(grouped); // <-- This returns an array
    // },




    getGroupedStatus: () => {
        const { statuses } = get();
        // if (!Array.isArray(statuses)) return {};   // ✅ avoid crash if not array

        return statuses.reduce((acc, status) => {
            const statusUserId = status.user?._id;
            if (!acc[statusUserId]) {
                acc[statusUserId] = {
                    id: statusUserId,
                    name: status?.user?.username,
                    avatar: status?.user?.profilePicture,
                    statuses: [],
                };
            }
            acc[statusUserId].statuses.push({
                id: status._id,
                media: status.content,
                contentType: status.contentType,
                timestamp: status.createdAt,
                viewers: status.viewers,
            });
            return acc;
        }, {});
    },


    getUserStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return userId ? groupedStatus[userId] : null
    },

    getOtherStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return Object.values(groupedStatus).filter(
            (contact) => contact.id !== userId
        )
    },

    // clearerror
    clearError: () => set({ error: null }),

    reset: () =>
        set({
            // state
            statuses: [],
            loading: false,
            error: null,
        }),
}))



export default useStatusStore;






















// import { create } from "zustand"
// import { getSocket } from "../services/chat.services"
// import axiosInstance from "../services/url.services"
// import useUserStore from "../store/useUserStore"

// const useStatusStore = create((set, get) => ({

//     // state
//     statuses: [],
//     loading: false,
//     error: null,

//     // helpers
//     setStatuses: (statuses) => set({ statuses }),
//     setLoading: (loading) => set({ loading }),
//     setError: (error) => set({ error }),

//     // ✅ Initialize socket listeners
//     initializeSocket: () => {
//         const { user } = useUserStore.getState(); // ✅ fixed (no hooks outside React)
//         if (!user?._id) return;

//         const socket = getSocket(user._id);
//         if (!socket) return;

//         // realtime: add new status
//         socket.on("new_status", (newStatus) => {
//             set((state) => ({
//                 statuses: state.statuses.some((s) => s._id === newStatus._id)
//                     ? state.statuses
//                     : [newStatus, ...state.statuses],
//             }));
//         });

//         // realtime: delete status
//         socket.on("status_deleted", (statusId) => {
//             set((state) => ({
//                 statuses: state.statuses.filter((s) => s._id !== statusId),
//             }));
//         });

//         // realtime: update viewers
//         socket.on("status_viewed", (statusId, viewers) => {
//             set((state) => ({
//                 statuses: state.statuses.map((status) =>
//                     status._id === statusId ? { ...status, viewers } : status
//                 ),
//             }));
//         });
//     },

//     // cleanup socket
//     cleanupSocket: (userId) => {
//         const socket = getSocket(userId);
//         if (socket) {
//             socket.off("new_status");
//             socket.off("status_deleted");
//             socket.off("status_viewed");
//         }
//     },

//     // ✅ fetch all statuses
//     fetchStatus: async () => {
//         set({ loading: true, error: null });
//         try {
//             const { data } = await axiosInstance.get("/status");
//             set({ statuses: data || [], loading: false });
//         } catch (error) {
//             console.error("Error fetching status", error);
//             set({ error: error.message, loading: false });
//         }
//     },

//     // ✅ create a new status
//     creatingStatus: async (statusData) => {
//         set({ loading: true, error: null });
//         try {
//             const formData = new FormData();

//             if (statusData.file) formData.append("media", statusData.file);
//             if (statusData.content?.trim()) formData.append("content", statusData.content);

//             const { data } = await axiosInstance.post("/status", formData, {
//                 headers: { "Content-Type": "multipart/form-data" }, // ✅ fixed typo
//             });

//             if (data?.data) {
//                 set((state) => ({
//                     statuses: state.statuses.some((s) => s._id === data.data._id)
//                         ? state.statuses
//                         : [data.data, ...state.statuses],
//                 }));
//             }
//             return data.data;
//         } catch (error) {
//             console.error("Error creating status", error);
//             set({ error: error.message, loading: false });
//             throw error;
//         }
//     },

//     // ✅ mark status as viewed
//     viewStatus: async (statusId) => {
//         try {
//             await axiosInstance.put(`/status/${statusId}/view`);
//             set((state) => ({
//                 statuses: state.statuses.map((status) =>
//                     status._id === statusId ? { ...status } : status
//                 ),
//             }));
//         } catch (error) {
//             set({ error: error.message, loading: false });
//         }
//     },

//     // ✅ delete status
//     deleteStatus: async (statusId) => {
//         try {
//             await axiosInstance.delete(`/status/${statusId}`);
//             set((state) => ({
//                 statuses: state.statuses.filter((s) => s._id !== statusId),
//             }));
//         } catch (error) {
//             console.error("Error deleting status", error);
//             set({ error: error.message, loading: false });
//             throw error;
//         }
//     },

//     // ✅ get status viewers
//     getStatusViewers: async (statusId) => {
//         try {
//             const { data } = await axiosInstance.get(`/status/${statusId}/viewers`);
//             return data.data;
//         } catch (error) {
//             console.error("Error getting status viewers", error);
//             set({ error: error.message, loading: false });
//             throw error;
//         }
//     },

//     // ✅ group statuses by user
//     // getGroupedStatus: () => {
//     //     const { statuses } = get();
//     //     return statuses.reduce((acc, status) => {
//     //         const statusUserId = status.user?._id;
//     //         if (!statusUserId) return acc;

//     //         if (!acc[statusUserId]) {
//     //             acc[statusUserId] = {
//     //                 id: statusUserId,
//     //                 name: status?.user?.username,
//     //                 avatar: status?.user?.profilePicture,
//     //                 statuses: [],
//     //             };
//     //         }

//     //         acc[statusUserId].statuses.push({
//     //             id: status._id,
//     //             media: status.content,
//     //             contentType: status.contentType,
//     //             timeStamp: status.createdAt,
//     //             viewers: status.viewers,
//     //         });
//     //         return acc;
//     //     }, {});
//     // },

//     getGroupedStatus: () => {
//         const { statuses } = get();
//         if (!Array.isArray(statuses)) return {};   // ✅ avoid crash if not array
//         return statuses.reduce((acc, status) => {
//             const userId = status.user?._id || status.user;
//             if (!acc[userId]) {
//                 acc[userId] = {
//                     id: userId,
//                     name: status.user?.name || "Unknown",
//                     statuses: []
//                 };
//             }
//             acc[userId].statuses.push(status);
//             return acc;
//         }, {});
//     },





//     // ✅ get statuses of a single user
//     getUserStatuses: (userId) => {
//         const groupedStatus = get().getGroupedStatus();
//         return userId ? groupedStatus[userId] : null;
//     },

//     // ✅ get statuses of everyone except the current user
//     getOtherStatuses: (userId) => {
//         const groupedStatus = get().getGroupedStatus();
//         return Object.values(groupedStatus).filter(
//             (contact) => contact.id !== userId // ✅ fixed (was contact._id)
//         );
//     },

//     // reset / clear error
//     clearError: () => set({ error: null }),

//     reset: () => set({ statuses: [], loading: false, error: null }),
// }));

// export default useStatusStore;
