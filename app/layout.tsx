import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '우브(WooB) 매장 시뮬레이터',
  description: '매장 사진 위에 우브 디지털 배너 TV를 배치해보는 간편 시안 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
