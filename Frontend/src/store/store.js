import {configureStore} from '@reduxjs/toolkit';
import authReducer from "../authSlice";
import themeReducer from './themeSlice';

export const store= configureStore({
    reducer: {
        theme: themeReducer,
        auth: authReducer
    }
});