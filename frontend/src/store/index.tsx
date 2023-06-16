import { configureStore } from '@reduxjs/toolkit'
import globalReducer from "./reducers/global"
export const store = configureStore({
    reducer: {
        global: globalReducer,
    },
    // middleware: (getDefaultMiddleWare) => getDefaultMiddleWare(),
    // devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch