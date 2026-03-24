import React from 'react';
import { Provider } from 'react-redux';
import store from './app/store';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}