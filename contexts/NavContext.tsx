
import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

interface NavContextType {
  isBottomNavVisible: boolean;
  setBottomNavVisible: Dispatch<SetStateAction<boolean>>;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export const NavProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBottomNavVisible, setBottomNavVisible] = useState(true); // Default to true
  return (
    <NavContext.Provider value={{ isBottomNavVisible, setBottomNavVisible }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = (): NavContextType => {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
};
