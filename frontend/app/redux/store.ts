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
import storage from 'redux-persist/lib/storage';
import experienceReducer from './experienceSlice';
import skillReducer from './skillSlice';
import profileReducer from './profileSlice';
import jobReducer from './jobSlice';
import authReducer from './authSlice';
import formReducer from './formSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['experience', 'skill', 'profile', 'job', 'auth', 'form'], // Slices to persist
  blacklist: [] // Slices to not persist
};

// Combine reducers
const rootReducer = combineReducers({
  experience: experienceReducer,
  skill: skillReducer,
  profile: profileReducer,
  job: jobReducer,
  auth: authReducer,
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