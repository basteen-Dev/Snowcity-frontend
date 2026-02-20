import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import AppRouter from './router/AppRouter';
import { ChatbotProvider } from './context/ChatbotContext';
import { useTracking } from './hooks/useTracking';

export default function App() {
  useTracking();

  return (
    <Provider store={store}>
      <ChatbotProvider>
        <AppRouter />
        <Toaster position="top-right" />
      </ChatbotProvider>
    </Provider>
  );
}