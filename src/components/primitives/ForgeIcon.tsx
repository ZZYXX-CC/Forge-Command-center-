import React from 'react';
import { Icon } from '@iconify/react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

interface ForgeIconProps {
  name: string;          // just the base name, e.g. "fire" or "chart-square"
  style?: 'bold-duotone' | 'bold' | 'broken' | 'linear';
  size?: IconSize;
  className?: string;
}

export function ForgeIcon({
  name,
  style = 'bold-duotone',
  size = 'md',
  className,
}: ForgeIconProps) {
  return (
    <Icon
      icon={`solar:${name}-${style}`}
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
    />
  );
}
