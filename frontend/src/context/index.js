import React from 'react';

import { MediaProvider } from './useMedia';
import { TicketsContextProvider } from './Tickets/TicketsContext';
import { AuthProvider } from './Auth/AuthContext';
import { PageNumberMessagesProvider } from './Pagenumber/PagenumberContext';
import { ChatbotsCountProvider } from './ChatbotCount/ChatbotsCountContext';

const AppProvider = ({ children }) => (
  <AuthProvider>
    <TicketsContextProvider>
      <PageNumberMessagesProvider>
        <MediaProvider>
          <ChatbotsCountProvider>
            {children}
          </ChatbotsCountProvider>
        </MediaProvider>
      </PageNumberMessagesProvider>
    </TicketsContextProvider>
  </AuthProvider>
);

export default AppProvider;
