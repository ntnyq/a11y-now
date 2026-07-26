import type { DomService } from '@a11y-now/types';
/**
 * All page mutations flow through this service so `unmount()` can restore
 * the page exactly — the "leave no trace" guarantee.
 */
export declare const createDomService: (doc: Document) => DomService;
