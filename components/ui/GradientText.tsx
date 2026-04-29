import React from 'react';
import { Text, TextStyle } from 'react-native';
import { Colors } from '@/constants';

// Simplified version - gradient text requires @react-native-masked-view which needs native build
// For dev/Expo Go use colored text; install masked-view for production builds
interface Props {
  children: string;
  style?: TextStyle;
  colors?: [string, string];
}

export function GradientText({ children, style, colors }: Props) {
  return (
    <Text style={[style, { color: Colors.secondary }]}>{children}</Text>
  );
}
