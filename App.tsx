
import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import { ConsultationScreen } from './screens/ConsultationScreen';
import ProfileScreen from './screens/ProfileScreen';
import MarketplaceScreen from './screens/MarketplaceScreen';
import MarketplaceDetailScreen from './screens/MarketplaceDetailScreen';
import UserDetailScreen from './screens/UserDetailScreen';
import { ChatScreen } from './screens/ChatScreen';
import BottomNav from './components/BottomNav';
import { ROUTES } from './components/constants';
import NewProductScreen from './screens/NewProductScreen';
import { ProfileEditScreen } from './screens/ProfileEditScreen'; // Import ProfileEditScreen as named
import { useNav } from './contexts/NavContext'; // Import useNav

const App: React.FC = () => {
  const location = useLocation();
  const { isBottomNavVisible, setBottomNavVisible } = useNav();
  
  // --- State and Refs for scroll-based Nav visibility ---
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollTop = useRef(0);
  const [isNavVisibleOnScroll, setIsNavVisibleOnScroll] = useState(true);

  // This useEffect handles route-based visibility (the master switch)
  useEffect(() => {
    // These paths should not have a bottom nav.
    const pathsToHideNav = [
      ROUTES.PROFILE_EDIT,
    ];

    // These path prefixes indicate a detail screen or a screen that should not have a nav.
    const isDetailOrChatPage = (
      location.pathname.startsWith('/chat/') ||
      location.pathname.startsWith('/user/')
    );

    if (pathsToHideNav.includes(location.pathname) || isDetailOrChatPage) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
  }, [location.pathname, setBottomNavVisible]);

  // This useEffect handles the slide-in/out animation based on scroll direction
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      const scrollTop = mainEl.scrollTop;
      
      // Hide on scroll down (with a threshold), show on scroll up
      if (scrollTop > lastScrollTop.current && scrollTop > 100) {
        setIsNavVisibleOnScroll(false);
      } else {
        setIsNavVisibleOnScroll(true);
      }
      lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      className="flex flex-col h-screen max-w-md mx-auto bg-transparent"
    >
      <main ref={mainRef} className={`flex-grow overflow-y-auto ${isBottomNavVisible ? 'pb-12' : ''}`}> {/* Dynamic padding-bottom */}
        <Routes>
          <Route path={ROUTES.HOME} element={<HomeScreen />} />
          <Route path={ROUTES.CONSULTATION} element={<ConsultationScreen />} />
          <Route path={ROUTES.CONSULTATION_START} element={<ConsultationScreen />} />
          <Route path={ROUTES.PROFILE} element={<ProfileScreen />} />
          <Route path={ROUTES.PROFILE_EDIT} element={<ProfileEditScreen />} />
          <Route path={ROUTES.USER_DETAIL(':userId')} element={<UserDetailScreen />} />
          <Route path={ROUTES.CHAT(':chatId')} element={<ChatScreen />} />
        </Routes>
      </main>
      {isBottomNavVisible && <BottomNav isVisibleOnScroll={isNavVisibleOnScroll} />}
    </div>
  );
};

export default App;
