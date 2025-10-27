import React, { useEffect, useState } from 'react';
import { Consultation } from '../types';
import { SparklesIcon, XMarkIcon } from './constants';

const localPlaceholder = '/images/placeholder_image.png';

const InfoSection: React.FC<{ title: string; content?: string }> = ({ title, content }) => {
  if (!content) return null;
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-700 whitespace-pre-line bg-white/50 p-4 rounded-xl">{content}</p>
    </div>
  );
};

interface ConsultationResultDisplayProps {
  consultation: Consultation;
  onClose: () => void;
}

const ConsultationResultDisplay: React.FC<ConsultationResultDisplayProps> = ({ consultation, onClose }) => {
  const {
    beforeImageUrl,
    afterImageUrl,
    styleSummary,
    style,
    beforeImageAnalysis,
    changedDeskAnalysis,
    improvementPoints,
    rearrangementRecommendation,
  } = consultation;

  const [view, setView] = useState<'before' | 'after'>('after');
  const [imageSrc, setImageSrc] = useState(afterImageUrl || localPlaceholder);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setIsFading(true);
    const timer = window.setTimeout(() => {
      setImageSrc(view === 'before' ? (beforeImageUrl || localPlaceholder) : (afterImageUrl || localPlaceholder));
      setIsFading(false);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [view, beforeImageUrl, afterImageUrl]);

  const analysisFallback =
    consultation.detailAnalysis ||
    (consultation as any).analysis ||
    (consultation as any).rationale ||
    '';

  const analysisSections = [
    { title: '이렇게 바뀌었어요', content: changedDeskAnalysis || analysisFallback },
    { title: '이렇게 정리해보세요', content: rearrangementRecommendation },
    { title: '이렇게 개선해봐요', content: improvementPoints },
  ];

  const analysisHasContent = analysisSections.some(
    (section) => section.content && section.content.trim().length > 0
  );

  return (
    <div className="flex flex-col h-full bg-[var(--bg-color)]">
      <div className="flex justify-end px-4 pt-4">
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full bg-black/10 px-3 py-3 text-gray-800 hover:bg-black/15 transition-colors"
          aria-label="결과 닫고 컨설팅 시작 화면으로 이동"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <main className="flex-grow overflow-y-auto">
        <div className="relative w-full aspect-[4/3] neu-concave bg-gray-200">
          <img
            key={imageSrc}
            src={imageSrc}
            alt={view === 'before' ? '컨설팅 전 책상' : 'AI 컨설팅 후 책상'}
            className={`w-full h-full object-contain transition-opacity duration-150 ${isFading ? 'opacity-0' : 'opacity-100'}`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = localPlaceholder;
            }}
          />
        </div>

        <div className="flex justify-center py-4">
          <div className="bg-gray-800 p-1 rounded-full flex items-center space-x-1">
            <button
              onClick={() => setView('before')}
              className={`px-6 py-1.5 text-sm rounded-full font-semibold ${
                view === 'before' ? 'bg-white text-black' : 'text-white/80'
              } transition-colors`}
            >
              Before
            </button>
            <button
              onClick={() => setView('after')}
              className={`px-6 py-1.5 text-sm rounded-full font-semibold ${
                view === 'after' ? 'bg-white text-black' : 'text-white/80'
              } transition-colors`}
            >
              After
            </button>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-4">
          <header className="neu-convex p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center text-[var(--accent-text-color)] mb-2">
              <SparklesIcon className="w-5 h-5 mr-1.5" />
              <h2 className="text-lg font-bold">AI 컨설팅 결과: {style} 스타일</h2>
            </div>
            <p className="text-sm text-gray-600">{styleSummary}</p>
          </header>

          <section className="neu-concave p-4 rounded-2xl">
            {analysisHasContent ? (
              analysisSections.map((section) => (
                <InfoSection key={section.title} title={section.title} content={section.content} />
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">분석 텍스트가 충분하지 않습니다</p>
            )}
          </section>

          {view === 'before' && (
            <section className="p-4 neu-concave rounded-2xl">
              <InfoSection title="기존 책상 분석" content={beforeImageAnalysis} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConsultationResultDisplay;
