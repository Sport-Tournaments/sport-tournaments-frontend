import MainLayout from '@/components/layout/MainLayout';

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
