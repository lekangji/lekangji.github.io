import test from "node:test";
import assert from "node:assert/strict";
import { getImageMotion } from "./featured-projects.mjs";

test("featured image motion is bounded across the viewport", () => {
    const before = getImageMotion(1200, 600, 800);
    const middle = getImageMotion(100, 600, 800);
    const after = getImageMotion(-700, 600, 800);

    assert.equal(before.progress, 0);
    assert.equal(after.progress, 1);
    assert.equal(before.shift, -110);
    assert.equal(after.shift, 110);
    assert.ok(middle.scale > before.scale);
});
