import i18n from '@/locales';
const t = i18n.global.t;

export const DEVICE_TYPE_ENUM = {
  MOBILE: 'mobile',
  PC: 'pc'
} as const;

export const DEVICE_TYPE_MAP: Record<string, string> = {
  get 'mobile'() { return t('constants.device.mobile') },
  get 'pc'() { return t('constants.device.pc') }
};

export const DEVICE_TYPE_OPTIONS = Object.keys(DEVICE_TYPE_MAP).map((key) => {
  return {
    get label() { return DEVICE_TYPE_MAP[key] },
    value: key
  };
});
