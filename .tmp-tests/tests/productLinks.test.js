import { strict as assert } from "node:assert";
import { __TESTING__ as productHelpers } from "../services/product/attachProducts.js";
const { buildTokens, applyAffiliateProduct, markUnavailable } = productHelpers;
const extractedMock = { name: "로지텍 MX Keys", brand: "Logitech", model: "MX", keywords: [] };
const tokens = buildTokens(extractedMock);
assert.deepEqual(tokens, ["Logitech", "MX"], "buildTokens should return brand/model tokens");
const baseItem = {
    id: "item-1",
    name: "초기 아이템",
    description: "테스트 설명",
    price: 0,
    sellerId: "ai",
    isNewItem: true,
    hotspotCoordinates: { x: 0.5, y: 0.5 },
};
const product = {
    productName: "로지텍 MX Keys Mini",
    imageURL: "https://example.com/image.jpg",
    purchaseURL: "https://www.coupang.com/vp/products/123",
    price: 129000,
    isAffiliate: true,
    inStock: true,
    platform: "Coupang",
};
applyAffiliateProduct(baseItem, product, 0.92);
assert.equal(baseItem.purchaseURL, product.purchaseURL, "Affiliate link should attach to item");
assert.equal(baseItem.linkedProduct?.isAffiliate, true, "Linked product should mark affiliate flag");
assert.equal(baseItem.linkedProduct?.platform, "Coupang", "Linked product should note Coupang platform");
const fallbackItem = {
    id: "item-2",
    name: "실패 아이템",
    description: "설명",
    price: 0,
    sellerId: "ai",
    isNewItem: true,
    hotspotCoordinates: { x: 0.1, y: 0.2 },
};
markUnavailable(fallbackItem, "missing-affiliate-env");
assert.equal(fallbackItem.inStock, false, "Unavailable item should be marked out of stock");
assert.equal(fallbackItem.stockStatus, "상품 준비 중", "Unavailable item should expose placeholder status");
console.log("product link validation tests passed.");
