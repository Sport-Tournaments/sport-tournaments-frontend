import MainLayout from '@/components/layout/MainLayout';

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
