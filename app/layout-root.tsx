import type { Metadata } from 'next';
import { createDefaultMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = createDefaultMetadata();

export default function RootLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
