import React, { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import StyleSelector from '../components/StyleSelector';
import ConsultationResultDisplay from '../components/ConsultationResultDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAiConsultation, generateAfterImage } from '../services/geminiService';
import {
    Consultation,
    DeskStyle,
    PredefinedDeskStyle,
} from '../types';
import { SparklesIcon, GENERIC_ERROR_MESSAGE, API_KEY_ERROR_MESSAGE, ROUTES } from '../components/constants';
import { useNav } from '../contexts/NavContext';
import { mockConsultations, currentUserProfileData } from './mockData';

// Helper function to add the new consultation to the mock data array
const addMockConsultation = (consultation: Consultation) => {
  mockConsultations.unshift(consultation);
  if (consultation.userId === currentUserProfileData.id) {
    currentUserProfileData.consultationCount += 1;
  }
};

// --- State Management with useReducer for complexity ---

type State = {
    step: 'idle' | 'loading' | 'error' | 'result';
    selectedImageBase64: string | null;
    userPrompt: string;
    selectedStyle: PredefinedDeskStyle | null;
    customStyle: string;
    loadingMessage: string;
    errorMessage: string | null;
    consultationResult: Consultation | null;
};

type Action =
    | { type: 'SELECT_IMAGE'; payload: string }
    | { type: 'CLEAR_IMAGE' }
    | { type: 'SET_USER_PROMPT'; payload: string }
    | { type: 'SELECT_STYLE'; payload: PredefinedDeskStyle }
    | { type: 'SET_CUSTOM_STYLE'; payload: string }
    | { type: 'START_CONSULTATION' }
    | { type: 'SET_LOADING_MESSAGE'; payload: string }
    | { type: 'CONSULTATION_SUCCESS'; payload: Consultation }
    | { type: 'CONSULTATION_ERROR'; payload: string }
    | { type: 'RESET' };

const initialState: State = {
    step: 'idle',
    selectedImageBase64: null,
    userPrompt: '',
    selectedStyle: null,
    customStyle: '',
    loadingMessage: '',
    errorMessage: null,
    consultationResult: null,
};

function consultationReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SELECT_IMAGE':
            return { ...state, step: 'idle', selectedImageBase64: action.payload, consultationResult: null, errorMessage: null };
        case 'CLEAR_IMAGE':
            return { ...initialState };
        case 'SET_USER_PROMPT':
            return { ...state, userPrompt: action.payload };
        case 'SELECT_STYLE':
            return { ...state, selectedStyle: action.payload, customStyle: '' };
        case 'SET_CUSTOM_STYLE':
            return { ...state, customStyle: action.payload, selectedStyle: null };
        case 'START_CONSULTATION':
            return { ...state, step: 'loading', loadingMessage: "컨설팅을 시작합니다...", errorMessage: null };
        case 'SET_LOADING_MESSAGE':
            return { ...state, loadingMessage: action.payload };
        case 'CONSULTATION_SUCCESS':
            return { ...state, step: 'result', consultationResult: action.payload, loadingMessage: '' };
        case 'CONSULTATION_ERROR':
            return { ...state, step: 'error', errorMessage: action.payload, loadingMessage: '' };
        case 'RESET':
            return { ...initialState };
        default:
            return state;
    }
}

const LOADING_MESSAGES = [
    "AI가 현재 책상을 분석 중입니다...",
    "사용자님의 취향에 맞춰 스타일 컨셉을 구상하고 있어요.",
    "AI가 새로운 스타일의 책상을 그리고 있어요...",
    "추천 아이템과 정리 방법을 정리하는 중입니다.",
    "컨설팅 결과를 거의 다 완성했어요!",
];

export const ConsultationScreen: React.FC = () => {
    const [state, dispatch] = useReducer(consultationReducer, initialState);
    const { setBottomNavVisible } = useNav();
    const navigate = useNavigate();

    const {
        step,
        selectedImageBase64,
        userPrompt,
        selectedStyle,
        customStyle,
        loadingMessage,
        errorMessage,
        consultationResult
    } = state;

    useEffect(() => {
        // Hide bottom nav when loading or showing results, show otherwise.
        const shouldShowNav = step !== 'loading' && step !== 'result';
        setBottomNavVisible(shouldShowNav);
        // Cleanup function to ensure nav is visible when leaving the screen
        return () => { setBottomNavVisible(true); };
    }, [step, setBottomNavVisible]);


    const handleSubmit = async () => {
        const finalStyle = customStyle.trim() || selectedStyle;

        if (!selectedImageBase64 || !finalStyle) {
            dispatch({ type: 'CONSULTATION_ERROR', payload: "책상 이미지를 업로드하고 원하는 스타일을 선택 또는 입력해주세요." });
            return;
        }

        if (!process.env.API_KEY) {
            dispatch({ type: 'CONSULTATION_ERROR', payload: API_KEY_ERROR_MESSAGE });
            return;
        }

        dispatch({ type: 'START_CONSULTATION' });

        try {
            // --- Step 1: Get Text-based AI Consultation ---
            dispatch({ type: 'SET_LOADING_MESSAGE', payload: LOADING_MESSAGES[0] });
            
            const textConsultation = await getAiConsultation(selectedImageBase64, finalStyle, userPrompt);
            dispatch({ type: 'SET_LOADING_MESSAGE', payload: LOADING_MESSAGES[2] });


            // --- Step 2: Generate 'After' Image with AI ---
            const afterImageBase64 = await generateAfterImage(
                textConsultation.afterImageDescription || `A desk in ${finalStyle} style.`, 
                finalStyle,
                selectedImageBase64 // Pass the original image for editing
            );
            dispatch({ type: 'SET_LOADING_MESSAGE', payload: LOADING_MESSAGES[4] });

            
            // --- Step 3: Combine results and display ---
            const finalResult: Consultation = {
                id: `consult-${Date.now()}`,
                userId: currentUserProfileData.id, 
                timestamp: new Date().toISOString(),
                style: finalStyle,
                beforeImageUrl: selectedImageBase64,
                afterImageUrl: afterImageBase64,
                ...textConsultation,
                likeCount: 0,
                isLikedByCurrentUser: false,
                commentCount: 0,
                comments: []
            };
            
            addMockConsultation(finalResult);

            dispatch({ type: 'CONSULTATION_SUCCESS', payload: finalResult });

        } catch (err: any) {
            console.error("AI Consultation Error:", err);
            dispatch({ type: 'CONSULTATION_ERROR', payload: err.message || GENERIC_ERROR_MESSAGE });
        }
    };

    if (step === 'loading') {
        return <LoadingSpinner text={loadingMessage || "AI 컨설팅을 준비 중입니다..."} />;
    }

    const handleResultClose = () => {
        dispatch({ type: 'RESET' });
        navigate(ROUTES.CONSULTATION_START, { replace: true });
    };

    if (step === 'result' && consultationResult) {
        return <ConsultationResultDisplay consultation={consultationResult} onClose={handleResultClose} />;
    }
    
    const finalStyle = customStyle.trim() || selectedStyle;
    const isSubmitEnabled = selectedImageBase64 && finalStyle;

    return (
        <div className="p-4 pt-6 space-y-6">
            <header className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">AI 데스크 컨설팅</h1>
                <p className="text-sm text-gray-500">책상 사진을 올리고, AI의 맞춤 스타일링을 받아보세요!</p>
            </header>

            <div className="neu-convex p-4 sm:p-6 rounded-2xl space-y-4">
                <ImageUpload
                    onImageSelected={(base64) => dispatch({ type: 'SELECT_IMAGE', payload: base64 })}
                    previewUrl={selectedImageBase64}
                    onClear={() => dispatch({ type: 'CLEAR_IMAGE' })}
                />
                
                {selectedImageBase64 && (
                    <>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-2">
                                AI에게 더 알려주기 <span className="text-sm font-normal text-gray-500">(선택 사항)</span>
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">AI가 더 정확하게 컨설팅할 수 있도록, 꼭 유지하고 싶은 아이템이나 원하는 분위기에 대해 자유롭게 알려주세요.</p>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => dispatch({ type: 'SET_USER_PROMPT', payload: e.target.value })}
                                rows={3}
                                className="w-full p-3 neu-input rounded-2xl text-sm"
                                placeholder="예) 창문은 왼쪽에 있어요. 꼭 살리고 싶은 제 애착 인형입니다. 전체적으로 어두운 편이니 밝게 만들어주세요."
                                aria-label="AI에게 전달할 추가 요청사항 입력"
                            />
                        </div>

                        <StyleSelector 
                            selectedStyle={selectedStyle} 
                            onStyleSelect={(style) => dispatch({ type: 'SELECT_STYLE', payload: style })}
                            customStyle={customStyle}
                            onCustomStyleChange={(value) => dispatch({ type: 'SET_CUSTOM_STYLE', payload: value })}
                        />
                    </>
                )}
            </div>

            {(step === 'error' && errorMessage) && (
                <p className="text-red-600 text-center bg-red-100 p-3 rounded-lg mt-4 text-sm">{errorMessage}</p>
            )}

            {isSubmitEnabled && (
                <div className="mt-4">
                    <button
                        onClick={handleSubmit}
                        className="w-full neu-convex neu-button bg-[var(--accent-color)] text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
                        aria-live="polite"
                    >
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        AI 컨설팅 시작하기
                    </button>
                </div>
            )}
        </div>
    );
};
