import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const META_PIXEL_ID = '1301656325239976';

export const metadata: Metadata = {
  title: '우브(WooB) 매장 시뮬레이터',
  description: '매장 사진 위에 우브 디지털 배너 TV를 배치해보는 간편 시안 도구',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
