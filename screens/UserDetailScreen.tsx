import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Consultation } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import FeedCard from '../components/FeedCard';
import { ArrowLeftIcon, ROUTES } from '../components/constants';
import { mockUsers, mockConsultations } from './mockData';

const UserDetailScreen: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userConsultations, setUserConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const localPlaceholder = '/images/placeholder_image.png';

  useEffect(() => {
    setTimeout(() => {
      const foundUser = mockUsers.find(u => u.id === userId);
      if (foundUser) {
        setUser(foundUser);
        const consultationsForUser = mockConsultations.filter(c => c.userId === userId);
        setUserConsultations(consultationsForUser);
      }
      setIsLoading(false);
    }, 500);
  }, [userId]);

  if (isLoading) {
    return <LoadingSpinner text="사용자 프로필 정보를 불러오는 중입니다..." />;
  }

  if (!user) {
     return (
      <div className="h-screen flex flex-col bg-[var(--bg-color)]">
         <header className="p-4 bg-transparent flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 mr-2 neu-convex neu-button rounded-full" aria-label="뒤로 가기">
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">사용자 없음</h1>
        </header>
        <div className="flex-grow flex items-center justify-center">
            <p className="text-center text-red-500 p-8">요청하신 사용자 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--bg-color)]">
       <header className="p-4 bg-transparent flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 neu-convex neu-button rounded-full" aria-label="뒤로 가기">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 truncate">{user.name}님의 프로필</h1>
      </header>

      <div className="bg-transparent p-6 mt-0">
        <div className="flex items-center space-x-4 mb-4">
          <img 
            src={user.profileImageUrl || localPlaceholder} 
            alt={`${user.name}님의 프로필 사진`}
            className="w-20 h-20 rounded-full object-cover neu-convex p-1"
            onError={(e) => { e.currentTarget.src = localPlaceholder; }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-sm text-gray-500">컨설팅 횟수: {user.consultationCount}</p>
          </div>
        </div>
        {user.bio && <p className="text-gray-600 text-sm mb-4">{user.bio}</p>}
        <button 
            className="w-full py-2 px-4 bg-[var(--accent-color)] text-white rounded-2xl neu-convex neu-button transition-colors text-sm font-medium"
            onClick={() => {
                 if (user.id === 'currentUser123') { 
                    alert("현재 보고 계신 프로필은 본인 프로필입니다.");
                } else {
                    navigate(ROUTES.CHAT(user.id));
                }
            }}
            aria-label={user.id === 'currentUser123' ? '내 프로필 보기' : `${user.name}님에게 메시지 보내기`}
        >
            {user.id === 'currentUser123' ? '내 프로필' : '메시지 보내기'}
        </button>
      </div>

      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-3">{user.name}님의 컨설팅 내역</h2>
        {userConsultations.length > 0 ? (
          <div className="space-y-6">
            {userConsultations.map(consult => (
              <FeedCard key={consult.id} consultation={consult} user={user} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-6 neu-convex rounded-2xl">이 사용자는 아직 컨설팅 내역이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default UserDetailScreen;