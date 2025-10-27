import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import { ArrowLeftIcon, CheckIcon } from '../components/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNav } from '../contexts/NavContext';
import { ROUTES } from '../components/constants';
import { currentUserProfileData } from './mockData';

export const ProfileEditScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setBottomNavVisible } = useNav();

  const [currentName, setCurrentName] = useState('');
  const [currentBio, setCurrentBio] = useState('');
  const [currentProfileImagePreview, setCurrentProfileImagePreview] = useState<string | null>(null);
  const [newProfileImageBase64ForUpload, setNewProfileImageBase64ForUpload] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentName(currentUserProfileData.name || '새 사용자');
    setCurrentBio(currentUserProfileData.bio || '');
    setCurrentProfileImagePreview(currentUserProfileData.profileImageUrl || null);
    setNewProfileImageBase64ForUpload(null); // Reset on mount

    setBottomNavVisible(false); 
    return () => { setBottomNavVisible(true); };
  }, [setBottomNavVisible]);

  const handleImageSelected = useCallback((base64Image: string) => {
    if (base64Image) {
      setNewProfileImageBase64ForUpload(base64Image);
      setCurrentProfileImagePreview(base64Image); // Show new image as preview
    } else { // Image selection cleared
      setNewProfileImageBase64ForUpload(null);
      setCurrentProfileImagePreview(currentUserProfileData.profileImageUrl || null); // Revert to original or placeholder
    }
    setError(null);
  }, []);

  const handleSave = () => {
    if (!currentName.trim()) {
      setError("이름은 필수 항목입니다.");
      return;
    }
    setError(null);
    setIsLoading(true);

    // Simulate a network request delay to provide user feedback
    setTimeout(() => {
      try {
        let finalImageToSaveUrl = currentUserProfileData.profileImageUrl;

        if (newProfileImageBase64ForUpload) {
          // To fix the Firebase permission error in this prototype,
          // we'll use the local base64 data URI directly instead of attempting an upload.
          finalImageToSaveUrl = newProfileImageBase64ForUpload;
        }

        // Update the mock data object for the current session
        currentUserProfileData.name = currentName.trim();
        currentUserProfileData.bio = currentBio.trim();
        currentUserProfileData.profileImageUrl = finalImageToSaveUrl || '';

        setIsLoading(false);
        alert('프로필 정보가 성공적으로 업데이트되었습니다!');
        navigate(ROUTES.PROFILE);

      } catch (e: any) {
        console.error("Profile update error (simulated):", e);
        setError(`프로필 업데이트 중 오류 발생: ${e.message}`);
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleCancel = () => {
    navigate(ROUTES.PROFILE);
  };

  if (isLoading) {
    return <LoadingSpinner text="프로필 정보를 업데이트하는 중입니다..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-color)]"> 
      <header className="p-4 bg-transparent flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
            <button 
                onClick={handleCancel} 
                className="p-2 mr-2 neu-convex neu-button rounded-full"
                aria-label="취소하고 프로필 화면으로 돌아가기"
            >
            <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">프로필 수정</h1>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="neu-convex p-6 rounded-2xl">
          <h2 className="text-base font-semibold text-gray-800 mb-4">프로필 사진 변경</h2>
          <div className="flex flex-col items-center">
            <img
              src={currentProfileImagePreview || '/images/placeholder_image.png'} 
              alt="현재 프로필 사진 미리보기"
              className="w-32 h-32 rounded-full object-cover mb-4 neu-concave p-1 bg-gray-200 flex items-center justify-center text-gray-400 text-sm" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder_image.png'; }}
            />
            <ImageUpload onImageSelected={handleImageSelected} />
             <p className="text-xs text-gray-500 mt-2 text-center">새로운 프로필 사진을 업로드하세요.</p>
          </div>
        </div>

        <div className="neu-convex p-6 rounded-2xl space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="displayName"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="w-full p-3 neu-input rounded-2xl"
                maxLength={50}
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">소개 (선택 사항)</label>
              <textarea
                id="bio"
                value={currentBio}
                onChange={(e) => setCurrentBio(e.target.value)}
                rows={4}
                className="w-full p-3 neu-input rounded-2xl"
                maxLength={200}
                placeholder="자신을 간단히 소개해주세요."
              />
            </div>
        </div>
        
        {error && <p className="text-red-600 text-center bg-red-100 p-3 rounded-lg text-sm">{error}</p>}

      </main>
      
      <footer className="p-4 bg-transparent flex items-center justify-end space-x-3 sticky bottom-0 z-10">
        <button
          onClick={handleCancel}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 neu-convex neu-button rounded-2xl"
          aria-label="변경사항 취소"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-[var(--accent-color)] neu-convex neu-button rounded-2xl flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label="변경사항 저장"
        >
          <CheckIcon className="w-5 h-5 mr-1.5" />
          {isLoading ? "저장 중..." : "저장"}
        </button>
      </footer>
    </div>
  );
};