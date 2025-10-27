import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--bg-color)] p-4">
      <div className="relative w-16 h-16">
        {/* The Neumorphic sunken track */}
        <div 
          className="w-full h-full rounded-full neu-concave"
          role="presentation"
        ></div>

        {/* The spinning progress indicator */}
        <svg 
          className="absolute top-0 left-0 w-full h-full animate-spin" 
          style={{ transform: 'rotate(-90deg)' }} // Start animation from the top
          viewBox="0 0 100 100"
          role="status"
          aria-live="polite"
          aria-label="로딩 중"
        >
          <defs>
            <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-color)" />
              <stop offset="100%" stopColor="var(--accent-text-color)" />
            </linearGradient>
          </defs>
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            fill="none" 
            stroke="url(#spinner-gradient)" 
            strokeWidth="8"
            // Creates an arc that's ~25% of the circle's circumference
            strokeDasharray="66 264" 
            strokeLinecap="round"
          >
          </circle>
        </svg>
      </div>
      {text && <p className="mt-4 text-sm text-[var(--secondary-text)] font-medium text-center">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
