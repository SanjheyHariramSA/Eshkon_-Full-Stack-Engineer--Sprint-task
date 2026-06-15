import { configureStore, combineReducers } from "@reduxjs/toolkit";
import draftPageReducer from "./slices/draftPageSlice";
import uiReducer from "./slices/uiSlice";
import publishReducer from "./slices/publishSlice";
import { persistenceMiddleware } from "./persistence";

const rootReducer = combineReducers({
  draftPage: draftPageReducer,
  ui: uiReducer,
  publish: publishReducer,
});

/**
 * Store factory. A factory (not a singleton) is required for the App Router:
 * each request/render gets a fresh store to avoid cross-request state leakage in
 * RSC, and tests can spin up isolated stores.
 */
export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Thunk results carry ISO-string dates and plain objects only.
          ignoredActionPaths: ["meta.arg"],
        },
      }).concat(persistenceMiddleware),
    devTools: process.env.NODE_ENV !== "production",
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
