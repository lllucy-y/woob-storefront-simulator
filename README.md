# woob-storefront-simulator

우브(WooB) 디지털 배너 TV를 매장 정면 사진 위에 배치해보는 단일 페이지 MVP입니다.

## 주요 기능

- 매장 정면 사진 업로드(브라우저 내 처리)
- TV/스탠드 오버레이 드래그 배치(모바일 터치 지원)
- 슬라이더로 오버레이 크기 조절
- 결과 이미지를 PNG로 다운로드
- "무료 시안 요청하기" 폼 섹션 + Google Form 연동(임시 URL)
- 개인정보/설치 안내 문구 제공

## 기술 스택

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- react-konva / Konva

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 빌드 / 실행

```bash
npm run build
npm run start
```

## Vercel 배포

1. GitHub에 프로젝트 push
2. Vercel에서 New Project로 저장소 연결
3. Framework Preset: Next.js 자동 감지 확인
4. Deploy 클릭

> 별도 서버 저장소/DB 없이 브라우저에서만 이미지 처리됩니다.

## 참고

- Google Form 임시 URL: `https://forms.gle/REPLACE_ME`
- 실제 운영 시 Google Form 실제 URL로 교체하고, 항목 매핑이 필요하면 URL 파라미터를 조정하세요.
