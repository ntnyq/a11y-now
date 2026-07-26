import type { A11yMessages, I18nService, LocaleCode } from '@a11y-now/types';
export declare const createI18n: (initialLocale: LocaleCode, overrides?: Partial<Record<LocaleCode, A11yMessages>>) => I18nService;
