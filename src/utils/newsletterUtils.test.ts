import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAiSmartLayoutPlan,
  isNewsletterPubliclyVisible,
  normalizeNewsletterRecord,
  parseImageUrlsList,
  parseNewsletterOrgSettings,
  refineNewsletterContentForTemplate,
  type ImageAnalysisMetric,
} from './newsletterUtils.ts';

test('parseImageUrlsList preserves backward compatibility with single image_url and deduplicates', () => {
  assert.deepEqual(
    parseImageUrlsList(null, 'https://example.com/legacy.jpg'),
    ['https://example.com/legacy.jpg']
  );
  assert.deepEqual(
    parseImageUrlsList([], 'https://example.com/legacy.jpg'),
    ['https://example.com/legacy.jpg']
  );
  assert.deepEqual(
    parseImageUrlsList('["https://a.jpg","https://a.jpg","https://b.jpg"]', 'https://legacy.jpg'),
    ['https://a.jpg', 'https://b.jpg']
  );
  assert.equal(
    parseImageUrlsList(
      ['1', '2', '3', '4', '5', '6', '7'],
      null
    ).length,
    6
  );
});

test('normalizeNewsletterRecord handles legacy single-image rows and meta overlays safely', () => {
  const legacy = normalizeNewsletterRecord({
    id: 'nl-1',
    issue_no: '01',
    academic_year: '2568',
    issue_date: '2026-01-10',
    title: 'Legacy Newsletter',
    image_url: 'https://cdn.example.com/poster.jpg',
    is_published: true,
    views: 25,
    order_position: 1,
  });

  assert.deepEqual(legacy.image_urls, ['https://cdn.example.com/poster.jpg']);
  assert.equal(legacy.image_url, 'https://cdn.example.com/poster.jpg');
  assert.equal(legacy.template_type, 'template_1');
  assert.equal(legacy.status, 'approved');
  assert.equal(isNewsletterPubliclyVisible(legacy), true);

  const pendingWithOverlay = normalizeNewsletterRecord(
    {
      id: 'nl-2',
      issue_no: '02',
      academic_year: '2569',
      issue_date: '2026-02-01',
      title: 'Draft Row',
      image_url: 'https://cdn.example.com/1.jpg',
      is_published: false,
    },
    {
      'nl-2': {
        image_urls: [
          'https://cdn.example.com/1.jpg',
          'https://cdn.example.com/2.jpg',
          'https://cdn.example.com/3.jpg',
          'https://cdn.example.com/4.jpg',
        ],
        template_type: 'template_3',
        status: 'pending',
        created_by: 'teacher',
      },
    }
  );

  assert.equal(pendingWithOverlay.image_urls?.length, 4);
  assert.equal(pendingWithOverlay.template_type, 'template_3');
  assert.equal(pendingWithOverlay.status, 'pending');
  assert.equal(isNewsletterPubliclyVisible(pendingWithOverlay), false);
});

test('computeAiSmartLayoutPlan selects landscape hero first and recommends appropriate templates', () => {
  const metrics: ImageAnalysisMetric[] = [
    { url: 'portrait-1.jpg', index: 0, width: 900, height: 1200, aspectRatio: 0.75, orientation: 'portrait', resolutionScore: 10 },
    { url: 'landscape-hero.jpg', index: 1, width: 1920, height: 1080, aspectRatio: 1.77, orientation: 'landscape', resolutionScore: 20 },
    { url: 'square-1.jpg', index: 2, width: 1000, height: 1000, aspectRatio: 1, orientation: 'square', resolutionScore: 10 },
    { url: 'landscape-2.jpg', index: 3, width: 1600, height: 1200, aspectRatio: 1.33, orientation: 'landscape', resolutionScore: 18 },
    { url: 'portrait-2.jpg', index: 4, width: 800, height: 1000, aspectRatio: 0.8, orientation: 'portrait', resolutionScore: 9 },
  ];

  const bentoPlan = computeAiSmartLayoutPlan({
    title: 'กิจกรรมวันวิทยาศาสตร์',
    summary: 'นักเรียนร่วมสนุกกับฐานการเรียนรู้วิทยาศาสตร์',
    content: 'นักเรียนได้ทดลองปฏิบัติจริงในห้องปฏิบัติการ',
    category: 'กิจกรรมสถานศึกษา',
    images: metrics,
  });

  assert.equal(bentoPlan.orderedUrls[0], 'landscape-hero.jpg');
  assert.equal(bentoPlan.recommendedTemplate, 'template_3');

  const longTextPlan = computeAiSmartLayoutPlan({
    title: 'รายงานประจำปี',
    summary: 'สรุปผลการดำเนินงานตลอดภาคเรียนที่ 1',
    content: 'ข้อความรายละเอียดข่าว '.repeat(45),
    category: 'งานวิชาการ',
    images: metrics.slice(0, 4),
  });
  assert.equal(longTextPlan.recommendedTemplate, 'template_4');
});

test('refineNewsletterContentForTemplate auto-generates summary and stays within 1-page A4 budget', () => {
  const result = refineNewsletterContentForTemplate({
    title: 'โครงการพัฒนาทักษะดิจิทัล',
    summary: '',
    content: 'รายละเอียดกิจกรรม '.repeat(80),
    templateType: 'template_1',
  });

  assert.ok(result.summary.length > 10 && result.summary.length <= 200);
  assert.ok(result.content.length <= 525);
});

test('parseNewsletterOrgSettings returns defaults safely on empty or invalid JSON', () => {
  const defaults = parseNewsletterOrgSettings('');
  assert.equal(defaults.defaultTemplate, 'template_1');
  assert.equal(defaults.headerTitle, 'จดหมายข่าวประชาสัมพันธ์');

  const custom = parseNewsletterOrgSettings(
    JSON.stringify({
      defaultTemplate: 'template_2',
      headerTitle: 'วารสารบ้านหาดเค็ด',
      directorTitle: 'ผู้อำนวยการสถานศึกษา',
    })
  );
  assert.equal(custom.defaultTemplate, 'template_2');
  assert.equal(custom.headerTitle, 'วารสารบ้านหาดเค็ด');
  assert.equal(custom.directorTitle, 'ผู้อำนวยการสถานศึกษา');
});
