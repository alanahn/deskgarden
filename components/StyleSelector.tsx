import React from 'react';
import { DESK_STYLES } from './constants';
import { PredefinedDeskStyle } from '../types';
import { SparklesIcon } from './constants';

interface StyleSelectorProps {
  selectedStyle: PredefinedDeskStyle | null;
  onStyleSelect: (style: PredefinedDeskStyle) => void;
  customStyle: string;
  onCustomStyleChange: (value: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleSelect, customStyle, onCustomStyleChange }) => {
  return (
    <div className="my-6 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">스타일 선택:</h3>
        <div className="grid grid-cols-3 gap-3">
          {DESK_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => onStyleSelect(style)}
              className={`p-3 rounded-2xl text-center font-medium whitespace-nowrap transition-all duration-150 ease-in-out
                ${selectedStyle === style
                  ? 'neu-concave bg-[var(--accent-color)] text-white' 
                  : 'neu-convex neu-button text-gray-700'
                }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg-color)] px-2 text-sm text-gray-500">또는</span>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-[var(--accent-text-color)]"/>
            나만의 스타일 입력하기
        </h3>
        <input
            type="text"
            value={customStyle}
            onChange={(e) => onCustomStyleChange(e.target.value)}
            placeholder="예: 사이버펑크, 스칸디나비아"
            className="w-full p-3 neu-input rounded-2xl text-sm"
            maxLength={30}
            aria-label="Custom style input"
        />
        { customStyle && (
             <p className="text-xs text-gray-500 mt-2">
                입력하신 '<span className="font-semibold text-[var(--accent-text-color)]">{customStyle}</span>' 스타일로 컨설팅이 진행됩니다.
            </p>
        )}
      </div>
    </div>
  );
};

export default StyleSelector;