import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRole,
  hasMenuPermission,
  SEED_ADMIN_USERS,
} from './authUtils.ts';

test('normalizeRole maps super_admin to admin and unknown roles to staff', () => {
  assert.equal(normalizeRole('super_admin'), 'admin');
  assert.equal(normalizeRole('executive'), 'executive');
  assert.equal(normalizeRole('sapha_plus'), 'sapha_plus');
  assert.equal(normalizeRole('unknown_role'), 'staff');
  assert.equal(normalizeRole(undefined), 'staff');
});

test('hasMenuPermission enforces role-based access control across 5 roles', () => {
  const adminUser = SEED_ADMIN_USERS.find((u) => u.role === 'admin')!;
  const execUser = SEED_ADMIN_USERS.find((u) => u.role === 'executive')!;
  const teacherUser = SEED_ADMIN_USERS.find((u) => u.role === 'teacher')!;
  const saphaUser = SEED_ADMIN_USERS.find((u) => u.role === 'sapha_plus')!;

  assert.equal(hasMenuPermission(adminUser, 'users'), true);
  assert.equal(hasMenuPermission(adminUser, 'homepage_layout'), true);
  assert.equal(hasMenuPermission(adminUser, 'settings'), true);

  assert.equal(hasMenuPermission(execUser, 'executive_view'), true);
  assert.equal(hasMenuPermission(execUser, 'users'), false);
  assert.equal(hasMenuPermission(execUser, 'homepage_layout'), false);

  assert.equal(hasMenuPermission(teacherUser, 'teacher_workspace'), true);
  assert.equal(hasMenuPermission(teacherUser, 'media'), true);
  assert.equal(hasMenuPermission(teacherUser, 'settings'), false);
  assert.equal(hasMenuPermission(teacherUser, 'homepage_layout'), false);

  assert.equal(hasMenuPermission(saphaUser, 'sapha_plus'), true);
  assert.equal(hasMenuPermission(saphaUser, 'students'), true);
});
