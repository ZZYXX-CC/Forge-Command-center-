import React from 'react';
import { Icon } from '@iconify/react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

interface ForgeIconProps {
  name: string;
  style?: 'bold-duotone' | 'bold' | 'broken' | 'linear';
  size?: IconSize | number;
  className?: string;
}

export function ForgeIcon({
  name,
  style = 'bold-duotone',
  size = 'md',
  className,
}: ForgeIconProps) {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  
  return (
    <Icon
      icon={`solar:${name}-${style}`}
      width={pixelSize}
      height={pixelSize}
      className={className}
    />
  );
}
