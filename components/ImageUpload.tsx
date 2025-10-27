import React, { useRef, useState, useCallback } from 'react';
import { PhotoIcon, XMarkIcon } from './constants';

interface ImageUploadProps {
  onImageSelected: (base64Image: string) => void;
  onGalleryClick?: () => void;
  previewUrl?: string | null;
  onClear?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelected, 
  onGalleryClick, 
  previewUrl: controlledPreviewUrl, 
  onClear 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uncontrolledPreviewUrl, setUncontrolledPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const localPlaceholder = '/images/placeholder_image.png';

  const isControlled = controlledPreviewUrl !== undefined;
  const previewUrl = isControlled ? controlledPreviewUrl : uncontrolledPreviewUrl;

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일(jpg, png, webp 등 형식)을 선택해주세요.');
        if (!isControlled) {
            setUncontrolledPreviewUrl(null);
        }
        onImageSelected('');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!isControlled) {
            setUncontrolledPreviewUrl(result);
        }
        onImageSelected(result);
        setError(null);
      };
      reader.onerror = () => {
        setError('선택하신 파일을 읽는데 실패했습니다. 다른 파일을 시도해주세요.');
        if (!isControlled) {
            setUncontrolledPreviewUrl(null);
        }
        onImageSelected('');
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelected, isControlled]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleGalleryButtonClick = () => {
    if (onGalleryClick) {
      onGalleryClick();
    } else {
      triggerFileInput();
    }
  };

  const clearSelection = () => {
    if (onClear) {
      onClear();
    } else {
      setUncontrolledPreviewUrl(null);
      onImageSelected('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* This input is always needed to trigger the file picker. */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-label="이미지 파일 선택기 (갤러리)"
      />
      
      <div className="w-full h-60 neu-concave rounded-2xl overflow-hidden flex items-center justify-center relative p-1">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="선택된 이미지 미리보기"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => { e.currentTarget.src = localPlaceholder; setError("이미지 미리보기에 실패했습니다."); }}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center text-gray-500 text-center p-4"
            aria-label="이미지 업로드 영역: 갤러리에서 선택하세요."
          >
            <PhotoIcon className="w-16 h-16 mb-2 text-gray-400" />
            <p className="font-semibold text-gray-700">책상 사진을 업로드하세요</p>
            <p className="text-xs">갤러리에서 이미지를 선택해주세요</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm text-center p-2 bg-red-100 rounded-md">{error}</p>}

      <div className="space-y-3">
        {previewUrl ? (
          <>
            <button
              onClick={handleGalleryButtonClick}
              className="neu-convex neu-button flex items-center justify-center w-full bg-[var(--accent-color)] text-white font-semibold py-3 px-4 rounded-2xl transition-colors"
              aria-label="갤러리에서 다른 사진 선택"
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              갤러리 변경
            </button>
            <button
              onClick={clearSelection}
              className="neu-convex neu-button flex items-center justify-center w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-2xl transition-colors"
              aria-label="선택 취소"
            >
              <XMarkIcon className="w-5 h-5 mr-2" />
              선택 취소
            </button>
          </>
        ) : (
          <button
            onClick={handleGalleryButtonClick}
            className="neu-convex neu-button flex items-center justify-center w-full bg-[var(--accent-color)] text-white font-semibold py-3 px-4 rounded-2xl transition-colors"
            aria-label="갤러리에서 이미지 선택"
          >
            <PhotoIcon className="w-5 h-5 mr-2" />
            갤러리에서 선택
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;