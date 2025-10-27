import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Consultation, User, Item, Comment } from '../types';
import { ROUTES, ShoppingBagIcon, HeartIconEmpty, HeartIconFilled, PaperAirplaneIcon, ChatBubbleLeftEllipsisIcon, XMarkIcon } from './constants';
import { currentUserProfileData } from '../screens/mockData';

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (seconds < 5) return "방금 전";
    if (seconds < 60) return `${Math.floor(seconds)}초 전`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}분 전`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}시간 전`;
    const days = hours / 24;
    return `${Math.floor(days)}일 전`;
};

const CommentsSheet: React.FC<{
    consultation: Consultation;
    comments: Comment[];
    commentCount: number;
    onClose: () => void;
    onCommentSubmit: (newComment: Comment) => void;
}> = ({ consultation, comments, commentCount, onClose, onCommentSubmit }) => {
    const [newCommentText, setNewCommentText] = useState('');
    const navigate = useNavigate();
    const localPlaceholder = '/images/placeholder_image.png';

    const handleSubmit = (e: React.FormEvent) => {
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
        onCommentSubmit(newComment);
        setNewCommentText('');
    };

    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="comments-heading">
            <div className="bg-[var(--bg-color)] rounded-t-2xl p-4 h-3/4 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="text-center font-bold mb-4 relative">
                    <h2 id="comments-heading">댓글 ({commentCount})</h2>
                    <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 p-1" aria-label="댓글 창 닫기"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                    {comments.length > 0 ? comments.map(comment => (
                        <div key={comment.id} className="flex items-start space-x-2.5">
                            <img src={comment.userProfileImageUrl || localPlaceholder} alt={`${comment.userName}님의 프로필`} className="w-8 h-8 rounded-full cursor-pointer" onClick={() => navigate(ROUTES.USER_DETAIL(comment.userId))} />
                            <div>
                                <p><button className="font-semibold text-sm text-left" onClick={() => navigate(ROUTES.USER_DETAIL(comment.userId))}>{comment.userName}</button> <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span></p>
                                <p className="text-sm text-gray-800 break-words">{comment.text}</p>
                            </div>
                        </div>
                    )) : <p className="text-center text-gray-500 pt-8">첫 댓글을 남겨보세요.</p>}
                </div>
                <form onSubmit={handleSubmit} className="flex items-center space-x-2 mt-4">
                    <img src={currentUserProfileData.profileImageUrl || localPlaceholder} alt="내 프로필" className="w-8 h-8 rounded-full" />
                    <input type="text" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} placeholder="댓글 추가..." className="flex-1 p-2.5 neu-input rounded-2xl text-sm" aria-label="새 댓글 입력" />
                    <button type="submit" disabled={!newCommentText.trim()} className="p-2.5 neu-convex neu-button bg-[var(--accent-color)] text-white rounded-2xl disabled:opacity-50" aria-label="댓글 게시"><PaperAirplaneIcon className="w-5 h-5" /></button>
                </form>
            </div>
        </div>
    );
};

const RecommendedItemsSheet: React.FC<{
    items: Item[];
    onClose: () => void;
}> = ({ items, onClose }) => {
    const localPlaceholder = '/images/placeholder_image.png';
    return (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="items-heading">
            <div className="bg-[var(--bg-color)] rounded-t-2xl p-4 max-h-[60%] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="text-center font-bold mb-4 relative">
                    <h2 id="items-heading">AI 추천 아이템</h2>
                    <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 p-1" aria-label="추천 아이템 창 닫기"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-4">
                    {items.map(item => {
                        const lp = item.linkedProduct;
                        const primary = item.purchaseURL || item.purchaseLinkUrl || lp?.link || '';
                        const fallback = item.fallbackPurchaseURL;
                        const href = item.inStock === false && fallback ? fallback : primary;
                        const thumb = item.imageURL || item.imageUrl || lp?.image || localPlaceholder;
                        const title = lp?.title || item.productName || item.name;
                        const category = lp?.category || item.productCategory || item.category;
                        const isOut = item.inStock === false;
                        const price = (lp?.priceKRW ?? item.price);
                        const isAffiliate = lp?.isAffiliate === true;
                        const finalPlatform = lp?.platform || lp?.source;

                        const CardContent = (
                            <>
                                <img
                                  src={thumb}
                                  alt={title}
                                  className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-100"
                                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.currentTarget as HTMLImageElement).src = localPlaceholder; }}
                                />
                                <h4 className="text-sm font-semibold truncate">{title}</h4>
                                {category && <p className="text-[11px] text-gray-500 truncate">{category}</p>}
                                {isOut && <p className="text-[10px] text-amber-600 truncate">품절(자동 대체 제안)</p>}
                                <p className="text-xs text-gray-600 truncate">{item.description}</p>
                                {typeof price === 'number' && (
                                  <p className="text-sm font-bold mt-1">₩{Number(price).toLocaleString()}</p>
                                )}
                                {isAffiliate && (
                                  <span className="mt-1 inline-flex items-center rounded-sm bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-600">
                                    제휴 링크{finalPlatform ? ` · ${finalPlatform}` : ''}
                                  </span>
                                )}
                            </>
                        );

                        const key = item.id || item.name;
                        if (href) {
                            return (
                              <a
                                key={key}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2 neu-flat rounded-2xl hover:shadow-inner transition-shadow"
                              >
                                {CardContent}
                              </a>
                            );
                        }

                        return (
                          <div key={key} className="block p-2 neu-flat rounded-2xl">
                            {CardContent}
                            <div className="mt-2 inline-flex items-center justify-center w-full px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-200 rounded-lg">
                              상품 준비 중
                            </div>
                          </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface ReelCardProps {
    consultation: Consultation;
    user: User;
}

const ReelCard: React.FC<ReelCardProps> = ({ consultation, user }) => {
    const navigate = useNavigate();
    const localPlaceholder = '/images/placeholder_image.png';
    const [view, setView] = useState<'before' | 'after'>('after');
    
    const [isLiked, setIsLiked] = useState(consultation.isLikedByCurrentUser || false);
    const [likeCount, setLikeCount] = useState(consultation.likeCount || 0);
    const [comments, setComments] = useState<Comment[]>(consultation.comments || []);
    const [commentCount, setCommentCount] = useState(consultation.commentCount || 0);

    const [showComments, setShowComments] = useState(false);
    const [showItems, setShowItems] = useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        consultation.isLikedByCurrentUser = !isLiked;
        consultation.likeCount = isLiked ? (consultation.likeCount || 1) - 1 : (consultation.likeCount || 0) + 1;
    };

    const handleCommentSubmit = (newComment: Comment) => {
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
        const newCount = commentCount + 1;
        setCommentCount(newCount);
        consultation.comments = updatedComments;
        consultation.commentCount = newCount;
    };
    
    return (
        <div className="h-full w-full relative snap-start flex-shrink-0 bg-black flex items-center justify-center">
            {/* Blurred Backgrounds for smooth transition */}
            <div className="absolute inset-0">
                <img 
                    src={consultation.beforeImageUrl || localPlaceholder} 
                    alt="" 
                    className={`absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-opacity duration-500 ease-in-out ${view === 'before' ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                />
                <img 
                    src={consultation.afterImageUrl || localPlaceholder} 
                    alt="" 
                    className={`absolute inset-0 w-full h-full object-cover filter blur-xl scale-110 transition-opacity duration-500 ease-in-out ${view === 'after' ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                />
            </div>

            {/* Main Images container for smooth transition */}
            <div className="relative w-full h-full">
                <img 
                    src={consultation.beforeImageUrl || localPlaceholder} 
                    alt={'컨설팅 전 책상'}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out ${view === 'before' ? 'opacity-100' : 'opacity-0'}`}
                />
                <img 
                    src={consultation.afterImageUrl || localPlaceholder} 
                    alt={'AI 컨설팅 후 책상'}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out ${view === 'after' ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            {/* Gradient Overlay for UI readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50"></div>

            {/* UI Overlays */}
            <div className="absolute inset-0 p-4 flex flex-col text-white">
                {/* Header: User Info */}
                <header className="flex items-center space-x-3 z-10">
                    <img 
                        src={user.profileImageUrl || localPlaceholder} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/80 cursor-pointer" 
                        onClick={() => navigate(ROUTES.USER_DETAIL(user.id))} 
                    />
                    <div>
                        <button className="font-bold text-sm text-left" onClick={() => navigate(ROUTES.USER_DETAIL(user.id))}>{user.name}</button>
                        <p className="text-xs text-white/80">{formatTimeAgo(consultation.timestamp)}</p>
                    </div>
                    <button className="ml-auto text-xs font-semibold bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/40 transition-colors">팔로우</button>
                </header>

                {/* This div will push the footer content to the bottom */}
                <div className="mt-auto z-10 space-y-3">
                    {/* Info Text */}
                    <div className="pr-16"> {/* Right padding to avoid overlap with action bar */}
                        <p className="font-semibold text-sm">{consultation.style} 스타일</p>
                        <p className="text-sm line-clamp-2">{consultation.styleSummary || `AI가 제안하는 '${consultation.style}' 스타일 데스크테리어`}</p>
                    </div>
                    
                    {/* Buttons Row */}
                    <div className="flex justify-between items-center w-full">
                        {/* Left: AI Button */}
                        <div>
                            {consultation.recommendedItems && consultation.recommendedItems.length > 0 && (
                                <button onClick={() => setShowItems(true)} className="flex items-center space-x-2 bg-black/40 backdrop-blur-md text-xs font-semibold px-4 py-2 rounded-full hover:bg-black/60 transition-colors">
                                    <ShoppingBagIcon className="w-4 h-4" />
                                    <span>AI 추천 아이템</span>
                                </button>
                            )}
                        </div>
                        {/* Right: B/A Toggle */}
                        <div>
                            <div className="bg-black/40 backdrop-blur-md p-1 rounded-full flex items-center space-x-1">
                                <button onClick={() => setView('before')} className={`px-5 py-1.5 text-sm rounded-full font-semibold ${view === 'before' ? 'bg-white text-black' : 'text-white/80'} transition-colors`}>Before</button>
                                <button onClick={() => setView('after')} className={`px-5 py-1.5 text-sm rounded-full font-semibold ${view === 'after' ? 'bg-white text-black' : 'text-white/80'} transition-colors`}>After</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right-side Action Bar */}
            <div className="absolute bottom-[20%] right-2 flex flex-col items-center space-y-5 z-10 text-white">
                <button onClick={handleLike} className="flex flex-col items-center space-y-1" aria-label={`좋아요 ${likeCount}개`}>
                    {isLiked ? <HeartIconFilled className="w-8 h-8 text-red-500 drop-shadow-lg" /> : <HeartIconEmpty className="w-8 h-8 drop-shadow-lg" />}
                    <span className="text-xs font-semibold">{likeCount}</span>
                </button>
                <button onClick={() => setShowComments(true)} className="flex flex-col items-center space-y-1" aria-label={`댓글 ${commentCount}개 보기`}>
                    <ChatBubbleLeftEllipsisIcon className="w-8 h-8 drop-shadow-lg" />
                    <span className="text-xs font-semibold">{commentCount}</span>
                </button>
                 <button onClick={() => alert('공유 기능은 곧 추가될 예정입니다!')} className="flex flex-col items-center space-y-1" aria-label="공유하기">
                    <PaperAirplaneIcon className="w-8 h-8 drop-shadow-lg" />
                    <span className="text-xs font-semibold">공유</span>
                </button>
            </div>

            {/* Modals */}
            {showComments && <CommentsSheet consultation={consultation} comments={comments} commentCount={commentCount} onClose={() => setShowComments(false)} onCommentSubmit={handleCommentSubmit} />}
            {showItems && consultation.recommendedItems && <RecommendedItemsSheet items={consultation.recommendedItems} onClose={() => setShowItems(false)} />}
        </div>
    );
};

export default ReelCard;
