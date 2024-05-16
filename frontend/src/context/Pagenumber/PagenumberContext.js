import React, { createContext, useContext, useState } from 'react';

const PageNumberContext = createContext();

const PageNumberMessagesProvider = ({ children }) => {
    const [pageNumber, setPageNumber] = useState(1);

    return (
        <PageNumberContext.Provider
            value={{ pageNumber, setPageNumber }}
        >
            {children}
        </PageNumberContext.Provider>
    );
};

export { PageNumberContext, PageNumberMessagesProvider };