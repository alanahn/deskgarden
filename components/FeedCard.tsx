

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Consultation, User, Item, Comment } from '../types'; // Import Comment
import { ROUTES, ShoppingBagIcon, HeartIconEmpty, HeartIconFilled, PaperAirplaneIcon, ChatBubbleLeftEllipsisIcon } from './constants'; // Import new icon
import { currentUserProfileData } from '../screens/mockData'; // For posting comments

// Time utility function
const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 5) return "방금 전";
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "년 전";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "달 전";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "일 전";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "시간 전";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "분 전";
    return Math.floor(seconds) + "초 전";
}

interface FeedCardProps {
  consultation: Consultation;
  user: User; // User who made this consultation
}

const FeedCard: React.FC<FeedCardProps> = ({ consultation, user }) => {
  const navigate = useNavigate();
  const localPlaceholder = '/images/placeholder_image.png';

  // State for likes
  const [isLiked, setIsLiked] = useState(consultation.isLikedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(consultation.likeCount || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  // State for comments
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(consultation.comments || []);
  const [commentCount, setCommentCount] = useState(consultation.commentCount || 0);
  const [newCommentText, setNewCommentText] = useState('');

  const handleUserClick = (userId: string) => {
    if (userId) {
        navigate(ROUTES.USER_DETAIL(userId));
    }
  };

  const handleLikeClick = () => {
    const newLikedState = !isLiked;
    let newLikeCount;

    if (newLikedState) { 
      newLikeCount = likeCount + 1;
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300); // Animation duration
    } else { 
      newLikeCount = Math.max(0, likeCount - 1); 
    }
    
    setLikeCount(newLikeCount);
    setIsLiked(newLikedState);

    // Update mock data 
    consultation.isLikedByCurrentUser = newLikedState;
    consultation.likeCount = newLikeCount;
  };
  
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      consultationId: consultation.id,
      userId: currentUserProfileData.id,
      userName: currentUserProfileData.name,
      userProfileImageUrl: currentUserProfileData.profileImageUrl,
      text: newCommentText.trim(),
      timestamp: new Date().toISOString(),
    };
    
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    const newCount = commentCount + 1;
    setCommentCount(newCount);
    setNewCommentText('');

    // Update mock data directly to persist state across component interactions
    consultation.comments = updatedComments;
    consultation.commentCount = newCount;
  };

  const heartBoingAnimation = `
    @keyframes heartBoing {
      0% { transform: scale(1); }
      50% { transform: scale(1.4); }
      100% { transform: scale(1); }
    }
    .animate-heart-boing {
      animation: heartBoing 0.3s ease-in-out;
    }
  `;

  const newRecommendedItems = consultation.recommendedItems?.filter(item => item.isNewItem) || [];

  return (
    <div className="neu-convex rounded-2xl overflow-hidden mb-6">
      <style>{heartBoingAnimation}</style>
      {/* User Header */}
      <div className="p-4 flex items-center space-x-3 cursor-pointer" onClick={() => handleUserClick(user.id)}>
        <img 
          src={user.profileImageUrl || localPlaceholder} 
          alt={`${user.name}님의 프로필 사진`}
          className="w-10 h-10 rounded-full object-cover" 
          onError={(e) => { e.currentTarget.src = localPlaceholder; e.currentTarget.alt = "사용자 프로필 이미지 로드 실패"; }}
        />
        <div>
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{new Date(consultation.timestamp).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Before/After Images */}
      <div className="relative flex w-full p-1 neu-concave">
        {/* Before Image */}
        <div className="relative w-1/2 aspect-[4/3]">
          <img 
            src={consultation.beforeImageUrl || localPlaceholder} 
            alt="컨설팅 전 책상 모습" 
            className="absolute inset-0 w-full h-full object-cover rounded-lg" 
            onError={(e) => { e.currentTarget.src = localPlaceholder; e.currentTarget.alt = "컨설팅 전 이미지 로드 실패"; }}
          />
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            Before
          </div>
        </div>
        {/* After Image */}
        <div className="relative w-1/2 aspect-[4/3]">
          <img 
            src={consultation.afterImageUrl || localPlaceholder} 
            alt={`AI가 제안한 ${consultation.style} 스타일 책상`}
            className="absolute inset-0 w-full h-full object-cover rounded-lg" 
            onError={(e) => { e.currentTarget.src = localPlaceholder; e.currentTarget.alt = "컨설팅 후 이미지 로드 실패"; }}
          />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
            After ({consultation.style})
          </div>
        </div>
        {/* Divider */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-white/30 z-10"></div>
      </div>
      
      {/* Recommended Items Preview (Optional) */}
      {newRecommendedItems.length > 0 && (
        <div className="p-4">
          <h4 className="text-base font-semibold text-gray-800 mb-3">AI 추천 아이템:</h4>
          <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
            {newRecommendedItems.map(item => {
              const imageSrc = item.imageURL || item.imageUrl || item.linkedProduct?.image;
              const purchaseLink = item.purchaseURL || item.purchaseLinkUrl || item.linkedProduct?.link;
              const title = item.productName || item.name;
              const category = item.productCategory || item.category;
              const Content = (
                <>
                  {imageSrc ? (
                    <img 
                      src={imageSrc} 
                      alt={title} 
                      className="w-full h-20 object-cover rounded-lg mb-2" 
                      onError={(e) => { e.currentTarget.src = localPlaceholder; e.currentTarget.alt = "추천 아이템 이미지 로드 실패"; }}
                    />
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center bg-gray-100 rounded-lg mb-2">
                       <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-800 truncate">{title}</p>
                  {category && <p className="text-[10px] text-gray-500 truncate">{category}</p>}
                </>
              );
              
              const cardClasses = "block flex-shrink-0 w-32 p-2 neu-flat rounded-2xl transition-all duration-150";

              if (purchaseLink) {
                return (
                  <a
                    key={item.id || title}
                    href={purchaseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cardClasses}
                    title={`${title} - 구매 링크로 이동`}
                  >
                    {Content}
                  </a>
                );
              }

              return (
                <div key={item.id || title} className={cardClasses}>
                  {Content}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Actions (Like, Comment) */}
      <div className="py-2 px-4 flex items-center space-x-4">
        <div 
          className="flex items-center space-x-1.5 cursor-pointer group p-2 rounded-full neu-button"
          onClick={handleLikeClick}
          role="button"
          aria-pressed={isLiked}
        >
          {isLiked ? 
            <HeartIconFilled className={`w-5 h-5 text-red-600 transition-transform ${isAnimating ? 'animate-heart-boing' : ''}`} /> : 
            <HeartIconEmpty className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
          }
          <span className={`text-sm font-medium tabular-nums ${isLiked ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-800'}`}>{likeCount}</span>
        </div>
        <button 
            onClick={() => setShowComments(!showComments)} 
            className="flex items-center space-x-1.5 text-gray-500 group p-2 rounded-full neu-button" aria-label="댓글 보기/작성"
            aria-expanded={showComments}
        >
           <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-400 group-hover:text-slate-500 transition-colors"/>
           <span className="text-sm font-medium group-hover:text-gray-800 tabular-nums">{commentCount}</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="p-4 neu-concave">
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto px-1">
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-2.5">
                            <img
                                src={comment.userProfileImageUrl || localPlaceholder}
                                alt={`${comment.userName}님의 프로필`}
                                className="w-8 h-8 rounded-full object-cover cursor-pointer flex-shrink-0"
                                onClick={() => handleUserClick(comment.userId)}
                                onError={(e) => { e.currentTarget.src = localPlaceholder; }}
                            />
                            <div className="flex-1 neu-convex p-2.5 rounded-lg">
                                <div className="flex items-baseline justify-between">
                                    <p 
                                        className="font-semibold text-sm text-gray-800 cursor-pointer" 
                                        onClick={() => handleUserClick(comment.userId)}
                                    >
                                        {comment.userName}
                                    </p>
                                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTimeAgo(comment.timestamp)}</p>
                                </div>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{comment.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-center text-gray-500 py-4">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                )}
            </div>
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
                <img
                    src={currentUserProfileData.profileImageUrl || localPlaceholder}
                    alt="내 프로필"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => { e.currentTarget.src = localPlaceholder; }}
                />
                <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="flex-1 p-2.5 neu-input rounded-2xl text-sm outline-none"
                    aria-label="새 댓글 입력"
                />
                <button 
                    type="submit" 
                    className="p-2.5 neu-convex neu-button bg-[var(--accent-color)] text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={!newCommentText.trim()}
                    aria-label="댓글 게시"
                >
                    <PaperAirplaneIcon className="w-5 h-5"/>
                </button>
            </form>
        </div>
      )}
    </div>
  );
};

export default FeedCard;
