import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHOOL_NEWS_CATEGORIES,
  normalizeCategoryMatch,
  filterNewsItems,
  partitionNewsHomeSections,
  sortNewsForDisplay,
  type BaseNewsRecord,
} from './newsUtils.ts';
import {
  parseHomepageSections,
  parseNewsHubSubSections,
  moveItemInOrder,
  reorderItemsById,
  mergeFilteredReorder,
  mergeHomepageSectionsFromTable,
  extractGoogleMapsEmbedSrc,
  parseWelcomePopupConfig,
  isPopupActiveNow,
} from './homepageLayoutUtils.ts';

const SAMPLE_NEWS: BaseNewsRecord[] = [
  {
    id: '1',
    title: 'ประเมินคุณภาพการศึกษาภายในโรงเรียน ประจำปีการศึกษา 2569',
    excerpt: 'การตรวจประเมินคุณภาพการศึกษาภายในระดับโรงเรียน',
    category: 'ข่าวประชาสัมพันธ์',
    sort_order: 2,
    is_pinned: true,
  },
  {
    id: '2',
    title: 'พิธีมอบเกียรติบัตรและกิจกรรมวันวิชาการ',
    excerpt: 'โรงเรียนบ้านหาดเค็ดจัดกิจกรรมวันวิชาการประจำปี',
    category: 'กิจกรรม',
    sort_order: 1,
    is_pinned: false,
  },
  {
    id: '3',
    title: 'นักเรียนคว้ารางวัลชนะเลิศเหรียญทอง การแข่งขันหุ่นยนต์และนวัตกรรม AI',
    excerpt: 'ตัวแทนนักเรียนคว้ารางวัลชนะเลิศระดับเขตพื้นที่',
    category: 'ผลงานนักเรียน',
    sort_order: 3,
    is_pinned: true,
  },
  {
    id: '4',
    title: 'ประกาศรับสมัครนักเรียนใหม่ ประจำปีการศึกษา 2569',
    excerpt: 'รับสมัครนักเรียนระดับอนุบาล ประถมศึกษา และมัธยมศึกษาตอนต้น',
    category: 'ประกาศ',
    sort_order: 4,
    is_pinned: true,
  },
];

test('SCHOOL_NEWS_CATEGORIES includes all core database categories', () => {
  assert.ok(SCHOOL_NEWS_CATEGORIES.includes('ข่าวประชาสัมพันธ์'));
  assert.ok(SCHOOL_NEWS_CATEGORIES.includes('กิจกรรม'));
  assert.ok(SCHOOL_NEWS_CATEGORIES.includes('ผลงานนักเรียน'));
  assert.ok(SCHOOL_NEWS_CATEGORIES.includes('ประกาศ'));
});

test('normalizeCategoryMatch matches exact and alias category names', () => {
  assert.equal(normalizeCategoryMatch('ข่าวประชาสัมพันธ์', 'ทั้งหมด'), true);
  assert.equal(normalizeCategoryMatch('กิจกรรม', 'กิจกรรมนักเรียน'), true);
  assert.equal(normalizeCategoryMatch('ผลงานนักเรียน', 'คนเก่งรังสิต'), true);
  assert.equal(normalizeCategoryMatch('ข่าวประชาสัมพันธ์', 'ผลงานนักเรียน'), false);
});

test('filterNewsItems filters by category and search keyword accurately', () => {
  const all = filterNewsItems(SAMPLE_NEWS, { category: 'ทั้งหมด' });
  assert.equal(all.length, 4);

  const activities = filterNewsItems(SAMPLE_NEWS, { category: 'กิจกรรม' });
  assert.equal(activities.length, 1);
  assert.equal(activities[0].id, '2');

  const searchAi = filterNewsItems(SAMPLE_NEWS, { category: 'ทั้งหมด', searchTerm: 'AI' });
  assert.equal(searchAi.length, 1);
  assert.equal(searchAi[0].id, '3');
});

test('sortNewsForDisplay respects admin sort_order ascending', () => {
  const sorted = sortNewsForDisplay(SAMPLE_NEWS, true);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ['2', '1', '3', '4']
  );
});

test('partitionNewsHomeSections separates news into homepage sections', () => {
  const sections = partitionNewsHomeSections(SAMPLE_NEWS);
  assert.equal(sections.publicRelations.length, 2);
  assert.equal(sections.studentActivities.length, 1);
  assert.equal(sections.smartStudents.length, 1);
  assert.equal(sections.prideItems.length, 1);
});

test('parseHomepageSections and moveItemInOrder reorder homepage sections cleanly', () => {
  const initial = parseHomepageSections(null);
  assert.equal(initial.length, 8);
  assert.equal(initial[0].id, 'hero');
  assert.equal(initial[1].id, 'about');

  const moved = moveItemInOrder(initial, 2, 'up');
  assert.equal(moved[1].id, 'news');
  assert.equal(moved[1].order, 2);
  assert.equal(moved[2].id, 'about');
  assert.equal(moved[2].order, 3);

  const reparsed = parseHomepageSections(JSON.stringify(moved));
  assert.equal(reparsed[1].id, 'news');
  assert.equal(reparsed[2].id, 'about');
});

test('reorderItemsById reorders NewsHub sub-sections accurately', () => {
  const initial = parseNewsHubSubSections(null);
  assert.equal(initial[0].id, 'public_relations');
  assert.equal(initial[1].id, 'student_activities');

  const reordered = reorderItemsById(initial, 'student_activities', 'public_relations');
  assert.equal(reordered[0].id, 'student_activities');
  assert.equal(reordered[0].order, 1);
  assert.equal(reordered[1].id, 'public_relations');
  assert.equal(reordered[1].order, 2);
});

test('parseWelcomePopupConfig defaults to disabled and honors date windows when enabled', () => {
  const defaultConfig = parseWelcomePopupConfig({});
  assert.equal(defaultConfig.enabled, false);
  assert.equal(isPopupActiveNow(defaultConfig, new Date('2026-06-15T12:00:00Z')), false);

  const config = parseWelcomePopupConfig({
    popup_enabled: 'true',
    popup_title: 'ประกาศเปิดเทอม 2569',
    popup_start_date: '2026-01-01',
    popup_end_date: '2026-12-31',
  });
  assert.equal(config.enabled, true);
  assert.equal(config.title, 'ประกาศเปิดเทอม 2569');
  assert.equal(isPopupActiveNow(config, new Date('2026-06-15T12:00:00Z')), true);
  assert.equal(isPopupActiveNow(config, new Date('2027-02-01T12:00:00Z')), false);

  const disabledConfig = parseWelcomePopupConfig({ popup_enabled: 'false' });
  assert.equal(isPopupActiveNow(disabledConfig, new Date('2026-06-15T12:00:00Z')), false);
});

test('extractGoogleMapsEmbedSrc accepts direct URLs and iframe snippets safely', () => {
  assert.equal(extractGoogleMapsEmbedSrc(''), '');
  assert.equal(extractGoogleMapsEmbedSrc('not-a-url'), '');
  assert.equal(
    extractGoogleMapsEmbedSrc('https://www.google.com/maps/embed?pb=123'),
    'https://www.google.com/maps/embed?pb=123'
  );
  assert.equal(
    extractGoogleMapsEmbedSrc(
      '<iframe src="https://www.google.com/maps/embed?pb=456" width="600" height="450"></iframe>'
    ),
    'https://www.google.com/maps/embed?pb=456'
  );
});

test('mergeHomepageSectionsFromTable overlays DB table rows while preserving order & fallbacks', () => {
  const base = parseHomepageSections(null);
  const merged = mergeHomepageSectionsFromTable(base, [
    { section_key: 'news', enabled: true, sort_order: 1 },
    { section_key: 'hero', enabled: true, sort_order: 2 },
    { section_key: 'newsletter', enabled: false, sort_order: 8 },
  ]);

  assert.equal(merged[0].id, 'news');
  assert.equal(merged[0].order, 1);
  assert.equal(merged[1].id, 'hero');
  assert.equal(merged[1].order, 2);
  const newsletter = merged.find((s) => s.id === 'newsletter');
  assert.equal(newsletter?.enabled, false);
});

test('mergeFilteredReorder reorders filtered subset while keeping hidden items in original slots', () => {
  const all = [
    { id: 'a', cat: 'x' },
    { id: 'b', cat: 'y' },
    { id: 'c', cat: 'x' },
    { id: 'd', cat: 'y' },
  ];
  const reorderedFiltered = [
    { id: 'c', cat: 'x' },
    { id: 'a', cat: 'x' },
  ];
  const merged = mergeFilteredReorder(all, reorderedFiltered);
  assert.deepEqual(
    merged.map((item) => item.id),
    ['c', 'b', 'a', 'd']
  );
});
