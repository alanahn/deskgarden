import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Consultation } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { ROUTES, SparklesIcon } from '../components/constants'; 
import { currentUserProfileData, mockConsultations } from './mockData';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const satisfactionEmojis = ['😞', '😟', '😐', '😊', '😄'];

  useEffect(() => {
    setIsLoading(true); 
    const timer = setTimeout(() => {
      // Re-read data from the centralized mock data source
      const myConsultations = mockConsultations.filter(c => c.userId === currentUserProfileData.id);
      
      currentUserProfileData.consultationCount = myConsultations.length;
      
      setUser({ ...currentUserProfileData }); 
      setConsultations([...myConsultations].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setIsLoading(false);
    }, 100); 
    return () => clearTimeout(timer);
  }, []);

  const handleSatisfactionChange = (emoji: string) => {
    currentUserProfileData.satisfactionEmoji = emoji; 
    setUser({...currentUserProfileData}); 
  };


  if (isLoading) {
    return <LoadingSpinner text="프로필 정보를 불러오는 중입니다..." />;
  }

  if (!user) {
    return <p className="text-center text-red-500 p-8">프로필 정보를 불러올 수 없습니다.</p>;
  }
  const localPlaceholder = '/images/placeholder_image.png';

  return (
    <div className="min-h-full bg-[var(--bg-color)]">
      <div className="bg-transparent p-6">
        <div className="flex items-center space-x-4 mb-4">
          <img 
            src={user.profileImageUrl || localPlaceholder} 
            alt={`${user.name}님의 프로필 사진`}
            className="w-20 h-20 rounded-full object-cover neu-convex p-1 bg-gray-200 flex items-center justify-center text-gray-400"
            onError={(e) => { (e.target as HTMLImageElement).src = localPlaceholder; (e.target as HTMLImageElement).alt="프로필 이미지 없음"; }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">컨설팅 횟수: {user.consultationCount}</p>
          </div>
        </div>
        {user.bio && <p className="text-gray-600 text-sm mb-4">{user.bio}</p>}
        <button 
            className="w-full py-2 px-4 neu-convex neu-button text-gray-700 rounded-2xl transition-colors text-sm font-medium"
            onClick={() => navigate(ROUTES.PROFILE_EDIT)}
        >
            프로필 편집하기
        </button>
      </div>

      <div className="p-4 m-4 neu-convex rounded-2xl">
        <h3 className="text-base font-semibold text-gray-800 mb-2">나의 서비스 만족도</h3>
        <div className="flex justify-around text-center mb-3">
            {satisfactionEmojis.map(emoji => (
                <button 
                    key={emoji}
                    onClick={() => handleSatisfactionChange(emoji)}
                    className={`p-2 rounded-full text-3xl transition-transform duration-150 ease-in-out ${user.satisfactionEmoji === emoji ? 'transform scale-125 neu-concave' : 'hover:scale-110'}`}
                    aria-label={`만족도: ${emoji}`}
                    aria-pressed={user.satisfactionEmoji === emoji}
                >
                    {emoji}
                </button>
            ))}
        </div>
        <p className="text-center text-sm text-gray-500">현재 만족도: {user.satisfactionEmoji}</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">최근 컨설팅 내역</h2>
          {consultations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultations.map(consult => (
                <div key={consult.id} className="neu-convex p-3 rounded-2xl">
                  <img 
                    src={consult.afterImageUrl || localPlaceholder}
                    alt={`${consult.style} 스타일 AI 제안`}
                    className="w-full h-32 object-cover rounded-lg mb-2" 
                    onError={(e) => { (e.target as HTMLImageElement).src = localPlaceholder; (e.target as HTMLImageElement).alt="이미지 로드 실패"; }}
                  />
                  <p className="font-medium text-gray-800 text-sm">{consult.style} 스타일</p>
                  <p className="text-xs text-gray-500">{new Date(consult.timestamp).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center text-sm py-4 neu-convex rounded-2xl">아직 컨설팅 내역이 없습니다.</p>
          )}
          <button 
              onClick={() => navigate(ROUTES.CONSULTATION)}
              className="mt-4 w-full flex items-center justify-center neu-convex neu-button bg-[var(--accent-color)] text-white font-semibold py-3 px-4 rounded-2xl transition-colors"
          >
            <SparklesIcon className="w-5 h-5 mr-2" /> 새 컨설팅 받기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;