import type { ComponentType, CSSProperties, ReactNode } from 'react';
export const ScrollStackItem: ComponentType<{ children?: ReactNode; itemClassName?: string; style?: CSSProperties }>;
declare const ScrollStack: ComponentType<{ children?: ReactNode; itemScale?: number; itemStackDistance?: number; itemDistance?: number; holdDistance?: number; useWindowScroll?: boolean; smoothScroll?: boolean; stackPosition?: number }>;
export default ScrollStack;
