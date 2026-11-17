import assert from "node:assert/strict";
import test from "node:test";
import { captureMedia, type CapturedRecord } from "./native-capture";

const record: CapturedRecord = {
  id: "notification:unit", packageName: "com.google.android.youtube",
  appLabel: "YouTube", title: "Test", text: "Saved locally",
  url: "", postedAt: 1,
};

test("native image mapping accepts only bounded expected media kinds", () => {
  const picture = captureMedia({ ...record, mediaKind: "picture", mediaB64: "YWJjZA==" });
  assert.deepEqual(picture, { kind: "picture", dataUrl: "data:image/jpeg;base64,YWJjZA==" });
  const icon = captureMedia({ ...record, mediaKind: "appIcon", mediaB64: "YWJjZA==" });
  assert.deepEqual(icon, { kind: "appIcon", dataUrl: "data:image/png;base64,YWJjZA==" });
  assert.equal(captureMedia({ ...record, mediaKind: "unknown", mediaB64: "YWJjZA==" }), undefined);
  assert.equal(captureMedia({ ...record, mediaKind: "picture", mediaB64: "not data!" }), undefined);
  assert.equal(captureMedia({ ...record, mediaKind: "picture", mediaB64: "A".repeat(400 * 1024 + 4) }), undefined);
  assert.equal(captureMedia(record), undefined);
});
