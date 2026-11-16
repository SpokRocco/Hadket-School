import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_CROP_ZOOM,
  MIN_CROP_ZOOM,
  clampCropTransform,
  clampZoom,
  computeBaseCoverScale,
  computeCropFrameDimensions,
  computeMaxPan,
  computeSourceCropRect,
  zoomCropTransformAtPoint,
} from './imageCropUtils.ts';

test('clampZoom bounds values safely and handles non-finite inputs', () => {
  assert.equal(clampZoom(0.4), MIN_CROP_ZOOM);
  assert.equal(clampZoom(5.5), MAX_CROP_ZOOM);
  assert.equal(clampZoom(1.75), 1.75);
  assert.equal(clampZoom(Number.NaN), MIN_CROP_ZOOM);
});

test('computeCropFrameDimensions calculates accurate 1:1 and 3:4 frames inside viewport', () => {
  const square = computeCropFrameDimensions(400, 320, 1);
  assert.equal(square.width, square.height);
  assert.equal(square.width, Math.round(320 * 0.82));

  const portrait = computeCropFrameDimensions(400, 320, 3 / 4);
  assert.equal(portrait.height, Math.round(320 * 0.82));
  assert.ok(Math.abs(portrait.width / portrait.height - 0.75) < 0.02);
});

test('computeBaseCoverScale covers the crop frame at zoom=1 for landscape and portrait photos', () => {
  const frame = { width: 200, height: 200 };
  assert.equal(computeBaseCoverScale({ width: 1000, height: 2000 }, frame), 0.2);
  assert.equal(computeBaseCoverScale({ width: 2000, height: 1000 }, frame), 0.2);
});

test('computeMaxPan and clampCropTransform allow panning along longer edge at zoom=1 and both axes at zoom>1', () => {
  const frame = { width: 200, height: 200 };
  const portrait = { width: 1000, height: 2000 };

  const panAt1x = computeMaxPan(portrait, frame, 1);
  assert.equal(panAt1x.maxPanX, 0);
  assert.equal(panAt1x.maxPanY, 100);

  const clamped1x = clampCropTransform({ panX: 50, panY: 180, zoom: 1 }, portrait, frame);
  assert.equal(clamped1x.panX, 0);
  assert.equal(clamped1x.panY, 100);

  const panAt2x = computeMaxPan(portrait, frame, 2);
  assert.equal(panAt2x.maxPanX, 100);
  assert.equal(panAt2x.maxPanY, 300);
});

test('computeSourceCropRect accurately maps pan and zoom back to natural image coordinates', () => {
  const frame = { width: 200, height: 200 };
  const portrait = { width: 1000, height: 2000 };

  // Centered 1x crop -> middle 1000x1000 block
  const centerCrop = computeSourceCropRect(portrait, frame, { panX: 0, panY: 0, zoom: 1 });
  assert.deepEqual(centerCrop, { sx: 0, sy: 500, sw: 1000, sh: 1000 });

  // Drag image down (+100px) -> crops top of photo (head/face area)
  const topCrop = computeSourceCropRect(portrait, frame, { panX: 0, panY: 100, zoom: 1 });
  assert.deepEqual(topCrop, { sx: 0, sy: 0, sw: 1000, sh: 1000 });

  // Drag image up (-100px) -> crops bottom of photo
  const bottomCrop = computeSourceCropRect(portrait, frame, { panX: 0, panY: -100, zoom: 1 });
  assert.deepEqual(bottomCrop, { sx: 0, sy: 1000, sw: 1000, sh: 1000 });

  // Zoom 2x centered -> middle 500x500 block
  const zoomedCrop = computeSourceCropRect(portrait, frame, { panX: 0, panY: 0, zoom: 2 });
  assert.deepEqual(zoomedCrop, { sx: 250, sy: 750, sw: 500, sh: 500 });
});

test('zoomCropTransformAtPoint preserves focal point under frame center when zooming via slider', () => {
  const frame = { width: 200, height: 200 };
  const portrait = { width: 1000, height: 2000 };

  // At 1x, panY=50 places natural y=750 at the center of the crop frame
  const start = { panX: 0, panY: 50, zoom: 1 };
  const zoomed = zoomCropTransformAtPoint(start, 2, { x: 0, y: 0 }, portrait, frame);
  assert.equal(zoomed.zoom, 2);
  assert.equal(zoomed.panY, 100);

  const rect = computeSourceCropRect(portrait, frame, zoomed);
  const centerY = rect.sy + rect.sh / 2;
  assert.equal(centerY, 750);
});
