// ===========================
// types.ts (updated)
// ===========================

/** 사용자 */
export interface User {
  id: string;
  name: string;
  profileImageUrl: string;
  bio?: string;
  consultationCount: number;
  satisfactionEmoji?: string;
}

/** 미리 정의된 책상 스타일 */
export type PredefinedDeskStyle =
  | "모던"
  | "미니멀리스트"
  | "게이밍"
  | "우드톤"
  | "빈티지"
  | "인더스트리얼";

/** 커스텀 문자열 허용 */
export type DeskStyle = PredefinedDeskStyle | string;

/** 상점/상품 카테고리(대분류) */
export type ProductCategory =
  | "가구"
  | "조명"
  | "수납"
  | "주변기기"
  | "전자기기"
  | "장식"
  | "기타";

/** 이미지 내 핫스팟(파란 점) 좌표: 0~1 정규화 */
export interface HotspotCoordinates {
  x: number; // 0..1
  y: number; // 0..1
}

export interface BoundingBox {
  x: number;      // 좌상단 x (0~1)
  y: number;      // 좌상단 y (0~1)
  width: number;  // 너비 (0~1]
  height: number; // 높이 (0~1]
}

/** 외부 상점 소스 구분 */
export type ProductSource = "Coupang" | "Naver" | "Amazon" | "Internal";

/** 매칭 타입 */
export type MatchType = "exact" | "close" | "style";

/**
 * 자동 매칭된 실제 상품 정보를 담는 구조체
 * - 파이프라인이 확정한 최종 링크/가격/이미지/신뢰도 등
 */
export interface LinkedProduct {
  title: string;
  brand?: string;
  model?: string;
  /** 내부 표준 카테고리 키(예: 'keyboard', 'monitor_arm' 등 자유 문자열) */
  category?: string;
  /** 색상/재질/치수 등 자유 속성 */
  attrs?: Record<string, string | number | boolean>;
  /** 최종(어필리에이트/직접) 링크 */
  link: string;
  /** 원화 가격 (있으면 표시) */
  priceKRW?: number;
  /** 썸네일 URL */
  image?: string;
  /** 상점 소스 */
  source: ProductSource;
  /** 0~1 신뢰도 점수 */
  confidence: number;
  /** 매칭 유형 */
  matchType: MatchType;
  /** 가격 갱신/TTL 판단용 타임스탬프(ISO) */
  fetchedAt?: string;
  /** 제휴 링크 여부 */
  isAffiliate?: boolean;
  /** 제휴 플랫폼 이름 (예: coupang) */
  platform?: string;
}

/**
 * 마켓/추천 아이템
 * - 기존 필드 그대로 유지 + 자동 링크 부착용 `linkedProduct` 추가
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;              // 내부 표시용 가격(없으면 0 또는 서버 로직)
  imageUrl?: string;
  category?: ProductCategory | string;
  productName?: string;
  productCategory?: string;
  purchaseURL?: string;
  imageURL?: string;
  inStock?: boolean;
  fallbackUsed?: boolean;
  fallbackPurchaseURL?: string;

  // Marketplace specific fields
  sellerId: string;
  dateListed?: string;        // ISO
  likeCount?: number;
  isLikedByCurrentUser?: boolean;

  // AI Recommendation specific fields (레거시 - 유지)
  purchaseLinkText?: string;  // (레거시) 버튼 문구
  purchaseLinkUrl?: string;   // (레거시) 직접 링크
  stockStatus?: string;       // (레거시)
  hypotheticalLink?: string;  // (레거시)
  isNewItem?: boolean;

  /**
   * 이미지 내 핫스팟 좌표 (해당 아이템을 클릭할 영역)
   * - 추천 카드가 아닌, After 이미지 위 점을 쓰는 경우에 사용
   */
  hotspotCoordinates?: HotspotCoordinates;
  hotspot?: HotspotCoordinates | null;
  boundingBox?: BoundingBox;
  box?: BoundingBox | null;
  lastRenderedPosition?: { x: number; y: number } | null;
  lastRenderedPixelPosition?: { left: number; top: number } | null;

  /**
   * 🔵 자동 매칭된 실제 상품 정보 (신규)
   * 파이프라인이 성공하면 이 필드가 채워짐. UI는 이걸 우선 사용.
   */
  linkedProduct?: LinkedProduct;
}

/** 스타일별 대체 이미지 세트 */
export interface StyleVariationImage {
  style: DeskStyle;
  images: string[];
}

/** 댓글 */
export interface Comment {
  id: string;
  consultationId: string;
  userId: string;
  userProfileImageUrl?: string;
  userName?: string;
  text: string;
  timestamp: string; // ISO string
}

/** 컨설팅 레코드 */
export interface Consultation {
  id: string;
  userId: string;
  style: DeskStyle;
  timestamp: string;

  beforeImageUrl: string;
  beforeImageAnalysis?: string;

  afterImageUrl?: string;
  afterImageDescription?: string;
  styleSummary?: string;
  changedDeskAnalysis?: string;

  improvementPoints?: string;
  rearrangementRecommendation?: string;

  /**
   * 추천 아이템 목록
   * - 각 Item은 hotspotCoordinates가 있을 수 있음
   * - 자동 상품 링크가 붙으면 item.linkedProduct로 제공
   */
  recommendedItems?: Item[];

  /** 스타일 변주 이미지 */
  styleVariationImages?: StyleVariationImage[];

  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  commentCount?: number;
  comments?: Comment[];
}

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number; // ms epoch
  imageUrl?: string;
  relatedItemId?: string; // Item.id 참조
}

/* ---------------------------------------------
   (선택) 파이프라인 보조 타입
   - After 설명/changedItems로부터 추출된 구조화 아이템
   - services/product 쪽에서 별도 파일로 빼도 되지만,
     단일 파일 구성을 원할 때 여기 포함해도 무방
--------------------------------------------- */
export interface ExtractedItem {
  name: string;                           // "키보드", "모니터암" 등
  brand?: string;
  model?: string;
  category?: string;                      // 표준화된 소분류 키
  attrs?: Record<string, string | number | boolean>;
  keywords: string[];                     // 검색용 조합 키워드
}
