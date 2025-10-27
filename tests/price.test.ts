import assert from "node:assert/strict";
import { parsePrice } from "../utils/price.js";

function testParsePrice() {
  const cases: Array<[unknown, number | null]> = [
    [27900, 27900],
    ["27900", 27900],
    ["27,900", 27900],
    ["₩27,900", 27900],
    ["  17,800원 ", 17800],
    [".99", 0.99],
    ["₩", null],
    ["", null],
    [null, null],
    [undefined, null],
    ["-1200", -1200],
    ["-₩1,200", -1200],
  ];

  cases.forEach(([input, expected]) => {
    const actual = parsePrice(input);
    assert.strictEqual(
      actual,
      expected,
      `parsePrice(${JSON.stringify(input)}) expected ${expected}, got ${actual}`,
    );
  });

  console.log("parsePrice tests passed.");
}

testParsePrice();

