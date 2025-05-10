'use client';

import { usePathname } from 'next/navigation';
import InfoCard from '@/components/ui/infocard';

export default function ConditionalInfoCard() {
  const pathname = usePathname();

  // Only render InfoCard if the pathname is exactly '/'
  if (pathname !== '/') {
    return null;
  }

  return <InfoCard />;
}