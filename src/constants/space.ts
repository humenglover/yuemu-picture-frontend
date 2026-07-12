import i18n from '@/locales';
const t = i18n.global.t;

// 空间级别枚举
export const SPACE_LEVEL_ENUM = {
  COMMON: 0,
  PROFESSIONAL: 1,
  FLAGSHIP: 2,
} as const

// 空间级别文本映射
export const SPACE_LEVEL_MAP: Record<number, string> = {
  get 0() { return t('constants.space.common') },
  get 1() { return t('constants.space.professional') },
  get 2() { return t('constants.space.flagship') },
}

// 空间级别选项映射
export const SPACE_LEVEL_OPTIONS = [
  { get label() { return SPACE_LEVEL_MAP[0] }, value: 0 },
  { get label() { return SPACE_LEVEL_MAP[1] }, value: 1 },
  { get label() { return SPACE_LEVEL_MAP[2] }, value: 2 },
]

// 空间类型枚举
export const SPACE_TYPE_ENUM = {
  PRIVATE: 0,
  TEAM: 1,
}

// 空间类型文本映射
export const SPACE_TYPE_MAP: Record<number, string> = {
  get 0() { return t('constants.space.private') },
  get 1() { return t('constants.space.team') },
}

// 空间类型选项映射
export const SPACE_TYPE_OPTIONS = [
  { get label() { return SPACE_TYPE_MAP[0] }, value: 0 },
  { get label() { return SPACE_TYPE_MAP[1] }, value: 1 },
]

// 空间角色枚举
export const SPACE_ROLE_ENUM = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
} as const;

// 空间角色文本映射
export const SPACE_ROLE_MAP: Record<string, string> = {
  get viewer() { return t('constants.space.viewer') },
  get editor() { return t('constants.space.editor') },
  get admin() { return t('constants.space.admin') },
};

// 空间角色选项映射
export const SPACE_ROLE_OPTIONS = [
  { get label() { return SPACE_ROLE_MAP['viewer'] }, value: 'viewer' },
  { get label() { return SPACE_ROLE_MAP['editor'] }, value: 'editor' },
  { get label() { return SPACE_ROLE_MAP['admin'] }, value: 'admin' },
];

/**
 * 空间权限常量
 */
export const SPACE_PERMISSION_ENUM = {
  SPACE_USER_MANAGE: 'spaceUser:manage',
  PICTURE_VIEW: 'picture:view',
  PICTURE_UPLOAD: 'picture:upload',
  PICTURE_EDIT: 'picture:edit',
  PICTURE_DELETE: 'picture:delete',
} as const;
