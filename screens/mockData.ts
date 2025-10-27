
import { User, Consultation, Item } from '../types';

// =================================================================================
// == SINGLE SOURCE OF TRUTH FOR MOCK DATA
// =================================================================================

// ---------------------------------------------------------------------------------
// -- USERS
// ---------------------------------------------------------------------------------

export let currentUserProfileData: User = { 
  id: 'currentUser123',
  name: '나의 데스크라이프', 
  profileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile5.jpeg?alt=media&token=a0a20025-23d0-4fc6-acf9-cc355f3bd352', 
  bio: 'AI 데스크 컨설팅으로 삶의 질을 높여보세요! ✨ 모던 & 미니멀 스타일을 선호합니다.', 
  consultationCount: 2, 
  satisfactionEmoji: '😊', 
};

// A consolidated list of all users from across the app's mock data
const allMockUsers: User[] = [
  currentUserProfileData,
  { id: 'user1', name: '데스크장인', profileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile1.jpeg?alt=media&token=2478bac5-ae64-494f-a30a-0452e400b550', consultationCount: 3, bio: "최고의 데스크 셋업을 찾아서." },
  { id: 'user2', name: '미니멀리스트킴', profileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile1.jpeg?alt=media&token=2478bac5-ae64-494f-a30a-0452e400b550', consultationCount: 5, bio: "Less is more." },
  { id: 'user3', name: '게이밍셋업콜렉터', profileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile3.jpeg?alt=media&token=61cdcf60-da4f-46a8-9a6a-8c702bc4f233', consultationCount: 2, bio: "RGB와 고성능 장비!" },
  { id: 'user4', name: '코지데스크조아', profileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile4.jpeg?alt=media&token=273bb36c-2fcf-4504-90fe-ef5f76405229', consultationCount: 8, bio: "따뜻하고 아늑한 작업 환경." },
];

// Ensure no duplicate user IDs
export const mockUsers = Array.from(new Map(allMockUsers.map(user => [user.id, user])).values());


// ---------------------------------------------------------------------------------
// -- MARKETPLACE ITEMS (REMOVED)
// ---------------------------------------------------------------------------------


// ---------------------------------------------------------------------------------
// -- CONSULTATIONS
// ---------------------------------------------------------------------------------

export let mockConsultations: Consultation[] = [
  { 
    id: 'consult1', userId: 'user1', style: '모던', 
    beforeImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_before3.png?alt=media&token=0dd36316-03ee-4f74-a9ae-f50b828bdfb7', 
    afterImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_after4.png?alt=media&token=05920d9c-3836-470b-a0da-13eca0d5eaa6', 
    timestamp: new Date(Date.now() - Math.random()*10*86400000).toISOString(),
    recommendedItems: [{
      id: 'recItem-bookends',
      name: '화이트 북엔드 세트',
      productName: '화이트 북엔드 세트',
      description: '깔끔한 디자인의 철제 북엔드로 책을 가지런히 정리하세요.',
      price: 12000,
      imageURL: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item3.png?alt=media&token=9610cd03-0857-4c10-9d47-1cb781e544c0',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item3.png?alt=media&token=9610cd03-0857-4c10-9d47-1cb781e544c0',
      sellerId: 'ai-store',
      category: '수납',
      productCategory: '수납',
      purchaseURL: 'https://link.coupang.com/a/cDFVWu',
      purchaseLinkUrl: 'https://link.coupang.com/a/cDFVWu'
    }],
    likeCount: 23, isLikedByCurrentUser: false,
    commentCount: 1,
    comments: [{ id: 'fc1-1', consultationId: 'consult1', userId: 'user4', userName: '코지데스크조아', userProfileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile4.jpeg?alt=media&token=273bb36c-2fcf-4504-90fe-ef5f76405229', text: '북엔드 정보 좀 알 수 있을까요?', timestamp: new Date(Date.now() - 1800000).toISOString() }]
  },
  { 
    id: 'consult2', userId: currentUserProfileData.id, style: '미니멀리스트', 
    beforeImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_before5.JPG?alt=media&token=67125311-2325-430c-b9cf-15e390ea1e7f', 
    afterImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_after5.png?alt=media&token=651c9de8-f124-4a0c-a3bd-23f1947fbd28', 
    timestamp: new Date(Date.now() - Math.random()*10*86400000).toISOString(),
    recommendedItems: [{
      id: 'recItem-ledStand',
      name: '반디엘이디 큐브 와이드 LED 스탠드',
      productName: '반디엘이디 큐브 와이드 LED 스탠드',
      description: '눈의 피로를 줄여주는 와이드형 LED 조명입니다.',
      price: 68000,
      imageURL: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item5.png?alt=media&token=e525cd1c-d420-4bf2-ae6f-82d609604827',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item5.png?alt=media&token=e525cd1c-d420-4bf2-ae6f-82d609604827',
      sellerId: 'ai-store',
      category: '조명',
      productCategory: '조명',
      purchaseURL: 'https://link.coupang.com/a/cDFSIM',
      purchaseLinkUrl: 'https://link.coupang.com/a/cDFSIM'
    }],
    likeCount: 45, isLikedByCurrentUser: true,
    commentCount: 2,
    comments: [
        { id: 'fc2-1', consultationId: 'consult2', userId: 'user1', userName: '데스크장인', userProfileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile1.jpeg?alt=media&token=2478bac5-ae64-494f-a30a-0452e400b550', text: 'AI 컨설팅 결과가 정말 좋네요!', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'fc2-2', consultationId: 'consult2', userId: 'user3', userName: '게이밍셋업콜렉터', userProfileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile3.jpeg?alt=media&token=61cdcf60-da4f-46a8-9a6a-8c702bc4f233', text: '저도 받아보고 싶어요.', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]
  },
  { 
    id: 'consult3', userId: 'user3', style: '게이밍', 
    beforeImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_before1.png?alt=media&token=8772d821-0572-416b-8e61-84439a3761e3', 
    afterImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_after1.png?alt=media&token=8861090a-8654-4396-828c-f3484888648e', 
    timestamp: new Date(Date.now() - Math.random()*10*86400000).toISOString(),
    recommendedItems: [{
      id: 'recItem-earphoneHook',
      name: '자석형 이어폰 후크',
      productName: '자석형 이어폰 후크',
      description: '이어폰 줄이나 가벼운 케이블을 간편하게 거치하는 자석 후크입니다.',
      price: 8000,
      imageURL: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item1.png?alt=media&token=935ce650-35a2-4613-a3e2-5a4d392ec91c',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item1.png?alt=media&token=935ce650-35a2-4613-a3e2-5a4d392ec91c',
      sellerId: 'ai-store',
      category: '주변기기',
      productCategory: '주변기기',
      purchaseURL: 'https://link.coupang.com/a/cDFPjK',
      purchaseLinkUrl: 'https://link.coupang.com/a/cDFPjK'
    }],
    likeCount: 50, isLikedByCurrentUser: false,
    commentCount: 0,
    comments: []
  },
   { 
    id: 'consult4', userId: 'user4', style: '아늑한', 
    beforeImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_before2.png?alt=media&token=0c0f9218-4c7c-42b8-833c-88a91727f5a9', 
    afterImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/feed_after2.png?alt=media&token=05e99898-d284-4964-bbd0-e4ad0f9789ef', 
    timestamp: new Date(Date.now() - Math.random()*15*86400000).toISOString(),
    recommendedItems: [{
      id: 'recItem-hiddenDrawer',
      name: '히든서랍 슬라이드 정리함',
      productName: '히든서랍 슬라이드 정리함',
      description: '책상 밑 공간을 활용하는 부착형 슬라이드 미니 서랍입니다.',
      price: 18000,
      imageURL: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item2.png?alt=media&token=f663a94e-8edd-40fa-bbec-e366e65cd76e',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/item2.png?alt=media&token=f663a94e-8edd-40fa-bbec-e366e65cd76e',
      sellerId: 'ai-store',
      category: '수납',
      productCategory: '수납',
      purchaseURL: 'https://link.coupang.com/a/cDFVbf',
      purchaseLinkUrl: 'https://link.coupang.com/a/cDFVbf'
    }],
    likeCount: 30, isLikedByCurrentUser: true,
    commentCount: 1,
    comments: [{ id: 'fc4-1', consultationId: 'consult4', userId: 'currentUser123', userName: '나의 데스크라이프', userProfileImageUrl: 'https://firebasestorage.googleapis.com/v0/b/deskteriortest.firebasestorage.app/o/profile5.jpeg?alt=media&token=a0a20025-23d0-4fc6-acf9-cc355f3bd352', text: '이런 서랍 아이디어 좋네요!', timestamp: new Date(Date.now() - 86400000).toISOString() }]
  },
];
