import { UnknownAction, configureStore } from '@reduxjs/toolkit'
import { slice } from './reducers'
import { RootState } from './types'

// Combine all reducers into a single reducer function
const rootReducer = (state: RootState, action: UnknownAction) =>
  slice.reducer(state, action)

// Load string from localStarage and convert into an Object
const loadFromLocalStorage = () => {
  try {
    const serialisedState = localStorage.getItem('persistantState')
    if (serialisedState === null) return undefined
    console.log(
      '[STORAGE] Loading state from localStorage',
      JSON.parse(serialisedState)
    )
    return JSON.parse(serialisedState)
  } catch (e) {
    console.warn(e)
    return undefined
  }
}

// Store the state to localStorage
const saveToLocalStorage = (state: RootState) => {
  try {
    console.log('[STORAGE] Saving state to localStorage', state)
    const serialisedState = JSON.stringify(state)
    localStorage.setItem('persistantState', serialisedState)
  } catch (e) {
    console.warn(e)
  }
}

/* -------------------------------------------------------------------------- */
/*                          Middleware configuration                          */
/* -------------------------------------------------------------------------- */
const logger = (store: any) => (next: any) => (action: any) => {
  console.log('[LOG] dispatching', action)
  const result = next(action)
  console.log('[LOG] next state', store.getState())
  return result
}

const crashReporter = (store: any) => (next: any) => (action: any) => {
  try {
    return next(action)
  } catch (err) {
    console.error('Caught an exception!', err)
    console.error('Error caught:', err, {
      action,
      state: store.getState()
    })
    throw err
  }
}
/* ------------------------------------ - ----------------------------------- */

// Configure the store with reducers and preloadedState from localStorage
const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadFromLocalStorage(),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(logger, crashReporter)
})

store.subscribe(() => saveToLocalStorage(store.getState()))

export default store
