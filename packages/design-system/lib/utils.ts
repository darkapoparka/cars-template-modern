import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const mergeClassNames = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'micro',
        'meta',
        'compact-control',
        'body',
        'prose',
        'dialog-title',
        'dialog-description',
        'card-title',
        'card-title-lg',
        'price',
        'price-lg',
        'section-title',
        'section-title-lg',
        'page-title',
        'page-title-lg',
        'display',
        'display-lg',
      ],
    },
  },
});

export const cn = (...inputs: ClassValue[]): string =>
  mergeClassNames(clsx(inputs));

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);
