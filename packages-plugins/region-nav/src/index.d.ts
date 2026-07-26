import type { ConfiguredPlugin } from '@a11y-now/types';
export type RegionType = 'content' | 'interactive' | 'list' | 'nav' | 'service' | 'window';
export interface RegionNavOptions {
    /** Override the selector heuristics per region type. */
    selectors?: Partial<Record<RegionType, string>>;
}
export interface RegionNavApi {
    clear: () => void;
    counts: () => Record<RegionType, number>;
    /** Enter a region; repeated calls cycle through its elements. */
    enter: (type: RegionType) => void;
    rescan: () => void;
}
/**
 * Region order mirrors the audited reference toolbar:
 * 视窗区 / 导航区 / 交互区 / 服务区 / 列表区 / 正文区 → Alt+1..6.
 */
export declare const REGION_TYPES: RegionType[];
/** Region navigation plugin. `Alt+1`..`Alt+6` enter and cycle regions. */
export declare const regionNav: (options?: RegionNavOptions) => ConfiguredPlugin<RegionNavOptions | undefined, RegionNavApi>;
declare module '@a11y-now/types' {
    interface A11yPluginRegistry {
        'region-nav': RegionNavApi;
    }
}
