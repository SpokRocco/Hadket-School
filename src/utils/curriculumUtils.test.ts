import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CURRICULUM_LEVELS,
  HADKET_DEFAULT_GRADE_OPTIONS,
  filterValidSchoolGrades,
  getCurriculumImageStyle,
  isLegacyHighSchoolTemplateProgram,
  matchGradesToLevel,
  normalizeCurriculumLevel,
  normalizeDirectImageUrl,
  resolveLevelHref,
  type GradeDataRow,
} from './curriculumHelpers.ts';

test('DEFAULT_CURRICULUM_LEVELS defines Hadket School 3 canonical levels with no hardcoded sample photos', () => {
  assert.equal(DEFAULT_CURRICULUM_LEVELS.length, 3);
  assert.deepEqual(
    DEFAULT_CURRICULUM_LEVELS.map((l) => l.id),
    ['kindergarten', 'primary', 'lower-sec']
  );
  assert.deepEqual(
    DEFAULT_CURRICULUM_LEVELS.map((l) => l.href),
    ['/curriculum#kindergarten', '/curriculum#primary', '/curriculum#lower-sec']
  );
  DEFAULT_CURRICULUM_LEVELS.forEach((level) => {
    assert.equal(level.image_url, '');
    assert.ok(level.subjects.length >= 6);
    assert.ok(level.highlights.length >= 3);
  });
});

test('HADKET_DEFAULT_GRADE_OPTIONS covers อ.2 through ม.3 (11 grades)', () => {
  assert.equal(HADKET_DEFAULT_GRADE_OPTIONS.length, 11);
  assert.equal(HADKET_DEFAULT_GRADE_OPTIONS[0], 'อนุบาล 2');
  assert.equal(HADKET_DEFAULT_GRADE_OPTIONS[10], 'มัธยมศึกษาปีที่ 3');
});

test('normalizeDirectImageUrl converts Google Drive links to lh3.googleusercontent.com/d/<id>', () => {
  assert.equal(
    normalizeDirectImageUrl('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view?usp=sharing'),
    'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQrStUv'
  );
  assert.equal(
    normalizeDirectImageUrl('https://drive.google.com/open?id=9ZyXwVuTsRqPoNmLkJ'),
    'https://lh3.googleusercontent.com/d/9ZyXwVuTsRqPoNmLkJ'
  );
  assert.equal(
    normalizeDirectImageUrl('https://example.supabase.co/storage/v1/object/public/images/cur.jpg'),
    'https://example.supabase.co/storage/v1/object/public/images/cur.jpg'
  );
  assert.equal(normalizeDirectImageUrl('  '), '');
  assert.equal(normalizeDirectImageUrl(null), '');
});

test('filterValidSchoolGrades strips legacy high school mock rows (>100 students) while retaining actual school grades', () => {
  const sample: GradeDataRow[] = [
    { id: '1', level: 'อนุบาล 2', rooms: 1, students: 6, is_active: true },
    { id: '2', level: 'ประถมศึกษาปีที่ 1', rooms: 1, students: 9, is_active: true },
    { id: '3', level: 'มัธยมศึกษาปีที่ 1', rooms: 1, students: 8, is_active: true },
    { id: '4', level: 'มัธยมศึกษาปีที่ 4', rooms: 8, students: 320, is_active: true },
    { id: '5', level: 'ม.5', rooms: 8, students: 315, is_active: true },
  ];

  const valid = filterValidSchoolGrades(sample);
  assert.equal(valid.length, 3);
  assert.deepEqual(
    valid.map((g) => g.level),
    ['อนุบาล 2', 'ประถมศึกษาปีที่ 1', 'มัธยมศึกษาปีที่ 1']
  );
});

test('matchGradesToLevel summarizes grade_data rows accurately per level pattern', () => {
  const grades: GradeDataRow[] = [
    { id: 'k2', level: 'อนุบาล 2', rooms: 1, students: 5, boys: 3, girls: 2, is_active: true },
    { id: 'k3', level: 'อนุบาล 3', rooms: 1, students: 7, boys: 4, girls: 3, is_active: true },
    { id: 'p1', level: 'ประถมศึกษาปีที่ 1', rooms: 1, students: 8, boys: 4, girls: 4, is_active: true },
    { id: 'p2', level: 'ป.2', rooms: 1, students: 10, boys: 5, girls: 5, is_active: true },
    { id: 'm1', level: 'มัธยมศึกษาปีที่ 1', rooms: 1, students: 6, boys: 3, girls: 3, is_active: true },
  ];

  const kinder = matchGradesToLevel(grades, 'kindergarten');
  assert.equal(kinder.levelCount, 2);
  assert.equal(kinder.totalRooms, 2);
  assert.equal(kinder.totalStudents, 12);
  assert.equal(kinder.summaryText, 'อนุบาล 2, อนุบาล 3 · 2 ห้องเรียน · 12 คน');

  const primary = matchGradesToLevel(grades, 'primary');
  assert.equal(primary.levelCount, 2);
  assert.equal(primary.totalRooms, 2);
  assert.equal(primary.totalStudents, 18);

  const lowerSec = matchGradesToLevel(grades, 'lower-sec');
  assert.equal(lowerSec.levelCount, 1);
  assert.equal(lowerSec.totalStudents, 6);
});

test('resolveLevelHref maps legacy /students or blank hrefs directly to /curriculum#<id>', () => {
  assert.equal(resolveLevelHref({ id: 'kindergarten', href: '/students' }), '/curriculum#kindergarten');
  assert.equal(resolveLevelHref({ id: 'primary', href: '/curriculum' }), '/curriculum#primary');
  assert.equal(resolveLevelHref({ id: 'lower-sec', href: '' }), '/curriculum#lower-sec');
  assert.equal(resolveLevelHref({ id: 'custom-1', href: '/curriculum#custom-1' }), '/curriculum#custom-1');
});

test('isLegacyHighSchoolTemplateProgram detects untouched template rows without flagging custom entries', () => {
  assert.equal(
    isLegacyHighSchoolTemplateProgram({
      title: 'วิทย์-คณิต',
      description: 'หลักสูตรเน้นวิทยาศาสตร์และคณิตศาสตร์ เตรียมความพร้อมสู่คณะแพทย์ วิศวกรรม และวิทยาศาสตร์',
    }),
    true
  );
  assert.equal(
    isLegacyHighSchoolTemplateProgram({
      title: 'วิทย์-คณิต',
      description: 'หลักสูตรวิทยาศาสตร์ประถมศึกษาและมัธยมต้น โรงเรียนบ้านหาดเค็ด',
    }),
    false
  );
});

test('normalizeCurriculumLevel & getCurriculumImageStyle preserve framing defaults and Zoom/Position', () => {
  const normalized = normalizeCurriculumLevel({
    id: 'kindergarten',
    image_url: 'https://drive.google.com/file/d/XYZ123/view',
    image_position: '50% 25%',
    image_scale: 1.3,
  });
  assert.equal(normalized.image_url, 'https://lh3.googleusercontent.com/d/XYZ123');
  assert.equal(normalized.href, '/curriculum#kindergarten');

  const style = getCurriculumImageStyle(normalized.image_position, normalized.image_scale);
  assert.equal(style.objectPosition, '50% 25%');
  assert.equal(style.transform, 'scale(1.3)');
});
