import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Spacing } from '@/constants';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint: Breakpoint = width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'phone';
    const isPhone = breakpoint === 'phone';
    const isTablet = breakpoint === 'tablet';
    const isDesktop = breakpoint === 'desktop';
    const pagePadding = isPhone ? Spacing.xl : Spacing['3xl'];
    const contentMaxWidth = isDesktop ? 1120 : isTablet ? 760 : width;
    const formMaxWidth = isPhone ? width : 440;
    const feedMaxWidth = isDesktop ? 560 : isTablet ? 520 : width;
    const columns = isDesktop ? 3 : isTablet ? 2 : 1;

    return {
      width,
      height,
      breakpoint,
      isPhone,
      isTablet,
      isDesktop,
      pagePadding,
      contentMaxWidth,
      formMaxWidth,
      feedMaxWidth,
      columns,
    };
  }, [height, width]);
}
