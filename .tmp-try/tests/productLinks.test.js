import { strict as assert } from "node:assert";
import { __TESTING__ as productHelpers } from "../services/product/attachProducts.js";
const { isAllowedDomain, containsSoldOut, isLikelyProductUrl, validateCandidate } = productHelpers;
assert.ok(isAllowedDomain("https://www.coupang.com/vp/products/12345"), "Coupang domain should be allowed");
assert.ok(!isAllowedDomain("https://example.com/product/1"), "Unknown domain should be rejected");
assert.ok(containsSoldOut("현재 품절입니다"), "Korean sold-out phrase should be detected");
assert.ok(containsSoldOut("Sold Out now"), "English sold-out phrase should be detected");
assert.ok(!containsSoldOut("구매 가능합니다"), "Availability text should not count as sold-out");
assert.ok(isLikelyProductUrl("https://www.coupang.com/vp/products/12345?itemId=67890"), "Standard Coupang product URL should be accepted");
assert.ok(!isLikelyProductUrl("https://www.coupang.com/np/search?q=keyboard"), "Search results should be rejected as product URLs");
assert.ok(isLikelyProductUrl("https://www.amazon.com/dp/B0C12345XY"), "Amazon dp link should be accepted");
assert.ok(!isLikelyProductUrl("https://www.amazon.com/s?k=keyboard"), "Amazon search results should be rejected");
assert.ok(isLikelyProductUrl("https://smartstore.naver.com/shop/products/1234567890"), "Naver SmartStore product path should be accepted");
const run = async () => {
    const validCandidate = await validateCandidate({
        link: "https://www.coupang.com/vp/products/12345",
        title: "새로운 데스크 램프",
        image: "https://image.example.com/product.jpg",
    });
    assert.deepEqual(validCandidate, { ok: true }, "Valid candidate should pass validation");
    const oosCandidate = await validateCandidate({
        link: "https://www.coupang.com/vp/products/99999",
        title: "품절 램프",
        image: "https://image.example.com/product.jpg",
    });
    assert.deepEqual(oosCandidate, { ok: false, reason: "soldout" }, "Sold-out keywords should fail validation");
    const nonProductCandidate = await validateCandidate({
        link: "https://www.coupang.com/np/search?q=lamp",
        title: "검색 결과",
        image: "https://image.example.com/product.jpg",
    });
    assert.deepEqual(nonProductCandidate, { ok: false, reason: "non-product" }, "Search pages should be rejected");
    console.log("product link validation tests passed.");
};
run().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
