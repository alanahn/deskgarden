import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// 사용하시는 경로에 맞게 수정해주세요.
import { ROUTES, SparklesIcon } from '../components/constants';
import { mockConsultations } from './mockData';
import { Consultation } from '../types';

// --- Carousel Card Component ---

interface CarouselCardData {
  id: string;
  type: 'before' | 'after';
  imageUrl: string;
  title: string;
  subtitle: string;
  consultationId: string;
}

const CarouselCard: React.FC<{ cardData: CarouselCardData }> = ({ cardData }) => {
  const localPlaceholder = '/images/placeholder_image.png';

  return (
    <div
      className="relative block w-full h-full bg-black rounded-2xl overflow-hidden"
      aria-label={`${cardData.title} (${cardData.subtitle})`}
    >
      <img
        src={cardData.imageUrl || localPlaceholder}
        alt={`${cardData.title} - ${cardData.subtitle}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
        loading="lazy"
        decoding="async"
        onError={(e) => { (e.target as HTMLImageElement).src = localPlaceholder; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div className="absolute top-4 left-4 z-10">
        <span className={`text-xs font-bold px-3 py-1 text-white rounded-full backdrop-blur-sm ${cardData.type === 'before' ? 'bg-gray-500/80' : 'bg-blue-500/80'}`}>
          {cardData.type === 'before' ? 'Before' : 'After'}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-bold text-lg truncate">{cardData.title}</h3>
        <p className="text-sm text-white/90 truncate mt-1">{cardData.subtitle}</p>
      </div>
    </div>
  );
};

// --- Main Home Screen Component ---
const CLONE_COUNT = 2;
const AUTO_SLIDE_INTERVAL = 2000;

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  const carouselItems: CarouselCardData[] = useMemo(() => {
    return mockConsultations.flatMap((consultation: Consultation) => [
      {
        id: `${consultation.id}-before`,
        type: 'before' as const,
        imageUrl: consultation.beforeImageUrl || '',
        title: `${consultation.style} 스타일`,
        subtitle: '컨설팅 전 모습',
        consultationId: consultation.id,
      },
      {
        id: `${consultation.id}-after`,
        type: 'after' as const,
        imageUrl: consultation.afterImageUrl || '',
        title: `${consultation.style} 스타일`,
        subtitle: 'AI 컨설팅 후',
        consultationId: consultation.id,
      }
    ]);
  }, []);

  const extendedCarouselItems = useMemo(() => {
    if (carouselItems.length === 0 || carouselItems.length <= CLONE_COUNT) return carouselItems;
    const startClones = carouselItems.slice(0, CLONE_COUNT);
    const endClones = carouselItems.slice(-CLONE_COUNT);
    return [...endClones, ...carouselItems, ...startClones];
  }, [carouselItems]);

  const [currentIndex, setCurrentIndex] = useState(CLONE_COUNT);
  const [isJumping, setIsJumping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-slide
  useEffect(() => {
    if (isPaused || extendedCarouselItems.length <= CLONE_COUNT * 2) return;

    const timer = window.setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, AUTO_SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, [extendedCarouselItems.length, isPaused]);

  // Scroll to active
  useEffect(() => {
    const targetCard = cardRefs.current[currentIndex];
    const container = scrollContainerRef.current;
    if (targetCard && container) {
      const targetOffset = targetCard.offsetLeft;
      const targetWidth = targetCard.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = targetOffset - (containerWidth / 2) + (targetWidth / 2);

      container.scrollTo({
        left: scrollLeft,
        behavior: isJumping ? 'auto' : 'smooth',
      });
    }
  }, [currentIndex, isJumping]);

  // Infinite loop jump
  useEffect(() => {
    if (isJumping || carouselItems.length === 0) return;

    const jumpToIndex = (newIndex: number) => {
      const timer = setTimeout(() => {
        setIsJumping(true);
        setCurrentIndex(newIndex);
      }, 300);
      return () => clearTimeout(timer);
    };

    if (currentIndex >= carouselItems.length + CLONE_COUNT) {
      return jumpToIndex(currentIndex - carouselItems.length);
    }
    if (currentIndex < CLONE_COUNT) {
      return jumpToIndex(currentIndex + carouselItems.length);
    }
  }, [currentIndex, isJumping, carouselItems.length]);

  useEffect(() => {
    if (isJumping) {
      const timer = setTimeout(() => setIsJumping(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isJumping]);

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <header className="px-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Desk<span className="text-[var(--accent-text-color)]">garden</span> <span className="text-base font-medium text-gray-500">책상정원</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">당신의 완벽한 데스크테리어를 찾아보세요!</p>
      </header>

      <section
        className="neu-convex p-6 rounded-2xl text-center cursor-pointer group"
        onClick={() => navigate(ROUTES.CONSULTATION)}
        role="button"
        aria-label="AI 책상 컨설팅 받기 페이지로 이동"
      >
        <h3 className="text-lg font-bold text-gray-800">AI가 내 책상을 바꿔준다면?</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">사진 한 장으로 새로운 스타일을 추천받으세요.</p>
        <button
          className="inline-flex items-center justify-center neu-button bg-[var(--accent-color)] group-hover:brightness-110 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-150"
          tabIndex={-1}
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          내 책상 컨설팅 받기
        </button>
      </section>
      <section role="region" aria-label="AI 컨설팅 엿보기" className="flex-grow flex flex-col min-h-0">
        <h2 className="text-lg font-bold text-gray-800 mb-2 px-2">AI 컨설팅 엿보기 ✨</h2>
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="listbox"
          aria-label="AI 컨설팅 캐러셀"
          style={{ scrollbarGutter: 'stable' }}
          className="h-[clamp(400px,65vh,650px)] min-h-0 flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth gap-3 px-4 sm:px-6 scroll-px-4 sm:scroll-px-6 focus:outline-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {extendedCarouselItems.map((cardData, index) => {
            const isActive = index === currentIndex;
            
            // --- 이 부분을 수정했습니다 ---
            // 모든 디바이스에서 하나의 아이템이 중앙에 오도록 반응형 너비 설정
            const cardWidthClasses = 'w-11/12 sm:w-5/6 md:w-3/4 lg:w-2/3';

            return (
              <div
                key={`${cardData.id}-${index}`}
                ref={el => { cardRefs.current[index] = el; }}
                role="option"
                aria-selected={isActive}
                className={`flex-shrink-0 snap-center ${cardWidthClasses} h-auto max-h-full`}
              >
                <div
                  className={`w-full h-auto aspect-[5/6] transition-all duration-300 ease-out rounded-2xl ${
                    isActive && !isJumping ? 'scale-105 opacity-100 shadow-2xl' : 'scale-90 opacity-80 shadow-lg'
                  }`}
                >
                  <CarouselCard cardData={cardData} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;