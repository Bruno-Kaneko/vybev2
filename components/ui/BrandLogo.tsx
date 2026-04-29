import React from 'react';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamily } from '@/constants';

type Props = {
  width?: number;
  height?: number;
  muted?: boolean;
};

export function BrandLogo({ width = 164, height = 52, muted }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 220 68">
      <Defs>
        <SvgLinearGradient id="vybeLogoGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={muted ? Colors.primaryShade : Colors.secondary} />
          <Stop offset="0.45" stopColor={Colors.secondary} />
          <Stop offset="1" stopColor={muted ? Colors.primary : Colors.primaryShade} />
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x="110"
        y="51"
        fill="url(#vybeLogoGradient)"
        fontFamily={FontFamily.heading}
        fontSize="52"
        fontWeight="800"
        letterSpacing="8"
        textAnchor="middle"
      >
        VYBE
      </SvgText>
    </Svg>
  );
}
