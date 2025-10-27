
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, PlusCircleIcon, UserCircleIcon } from './constants';
import { ROUTES } from './constants';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  const activeClasses = "neu-button-active";
  const activeColor = "text-[var(--accent-text-color)]";
  const inactiveColor = "text-[var(--secondary-text)]";

  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center flex-1 p-1 rounded-2xl transition-all duration-200 group ${isActive ? activeClasses : ''}`}
      aria-current={isActive ? "page" : undefined}
    >
      <div className={`flex items-center justify-center transition-all duration-300 ease-in-out transform group-active:scale-125 ${isActive ? activeColor : inactiveColor}`}>
        {icon}
      </div>
      <span className={`text-[10px] mt-0.5 transition-colors duration-300 ${isActive ? activeColor : inactiveColor}`}>{label}</span>
    </Link>
  );
};

interface BottomNavProps {
  isVisibleOnScroll: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ isVisibleOnScroll }) => {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 h-12 bg-[var(--bg-color)] flex items-stretch max-w-md mx-auto neu-flat p-1 transition-transform duration-300 ease-in-out ${isVisibleOnScroll ? 'translate-y-0' : 'translate-y-full'}`}>
      <NavItem to={ROUTES.HOME} icon={<HomeIcon className="w-4 h-4"/>} label="홈" />
      <NavItem to={ROUTES.CONSULTATION_START} icon={<PlusCircleIcon className="w-4 h-4"/>} label="컨설팅" />
      <NavItem to={ROUTES.PROFILE} icon={<UserCircleIcon className="w-4 h-4"/>} label="프로필" />
    </nav>
  );
};

export default BottomNav;
