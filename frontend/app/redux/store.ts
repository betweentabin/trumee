import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

// Create a safe storage that works with SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage = typeof window !== 'undefined' 
  ? createWebStorage('local') 
  : createNoopStorage();
import experienceReducer from './experienceSlice';
import skillReducer from './skillSlice';
import profileReducer from './profileSlice';
import jobReducer from './jobSlice';
import authReducer from './authSlice';
import authV2Reducer from './authV2Slice';
import formReducer from './formSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['experience', 'skill', 'profile', 'job', 'auth', 'authV2', 'form'], // Slices to persist
  blacklist: [] // Slices to not persist
};

// Combine reducers
const rootReducer = combineReducers({
  experience: experienceReducer,
  skill: skillReducer,
  profile: profileReducer,
  job: jobReducer,
  auth: authReducer,
  authV2: authV2Reducer,
  form: formReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persistence
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;