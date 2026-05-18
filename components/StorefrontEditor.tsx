'use client';

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { persistUtmParams, trackMetaCustomEvent, trackMetaPageView } from '@/lib/metaPixel';

type LoadedImage = {
  src: string;
  width: number;
  height: number;
};

type MockupOrientation = 'horizontal' | 'vertical';
type MockupIndustry =
  | 'flower'
  | 'bakery'
  | 'lifestyle'
  | 'fashion'
  | 'optical'
  | 'nail'
  | 'restaurant'
  | 'hospital'
  | 'other';

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.8;

const FALLBACK_MOCKUP_SRC = '/mockups/bakery-horizontal.png';

type PackageKey = 'light' | 'standard' | 'premium';

type WoobPackage = {
  key: PackageKey;
  title: string;
  description: string;
  composition: string;
  price: string;
  monthly: string;
  detailHref: string;
  isRecommended?: boolean;
};

const WOOB_PACKAGES: WoobPackage[] = [
  {
    key: 'light',
    title: '라이트 패키지',
    description: '홍보 영상 1종과 스마트 TV로 바로 시작하는 기본 구성',
    composition: '홍보 영상 1종(80초 내외) + 스마트 TV + 거치대',
    price: '968,000원',
    monthly: '월 80,667원',
    detailHref:
      'https://woob.life/product/%EB%9D%BC%EC%9D%B4%ED%8A%B8-%ED%8C%A8%ED%82%A4%EC%A7%80-%ED%99%8D%EB%B3%B4-%EC%98%81%EC%83%81-1%EC%A2%8580%EC%B4%88-%EB%82%B4%EC%99%B8-%EC%8A%A4%EB%A7%88%ED%8A%B8-tv%EA%B1%B0%EC%B9%98%EB%8C%80/27/category/1/display/4/?icid=MAIN.product_listmain_3',
  },
  {
    key: 'standard',
    title: '스탠다드 패키지',
    description: '홍보 영상 2종으로 가게의 매력을 더 다양하게 보여주는 구성',
    composition: '홍보 영상 2종(각 80초 내외) + 스마트 TV + 이동식 거치대',
    price: '1,089,000원',
    monthly: '월 90,750원',
    detailHref:
      'https://woob.life/product/%EC%8A%A4%ED%83%A0%EB%8B%A4%EB%93%9C-%ED%8C%A8%ED%82%A4%EC%A7%80-%ED%99%8D%EB%B3%B4-%EC%98%81%EC%83%81-2%EC%A2%85%EA%B0%81-80%EC%B4%88-%EB%82%B4%EC%99%B8%EC%8A%A4%EB%A7%88%ED%8A%B8tv%EC%9D%B4%EB%8F%99%EC%8B%9D%EA%B1%B0%EC%B9%98%EB%8C%80/37/category/1/display/4/?icid=MAIN.product_listmain_3',
    isRecommended: true,
  },
  {
    key: 'premium',
    title: '프리미엄 패키지',
    description: '홍보 영상과 매장 전용 홈페이지까지 연결하는 고급 구성',
    composition: '홍보 영상 2종 + 매장 전용 홈페이지 + 스마트 TV + 거치대',
    price: '1,815,000원',
    monthly: '월 151,250원',
    detailHref:
      'https://woob.life/product/%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84-%ED%8C%A8%ED%82%A4%EC%A7%80-%ED%99%8D%EB%B3%B4-%EC%98%81%EC%83%81-2%EC%A2%85%EA%B0%8180%EC%B4%88-%EB%82%B4%EC%99%B8%EB%A7%A4%EC%9E%A5%EC%A0%84%EC%9A%A9%ED%99%88%ED%8E%98%EC%9D%B4%EC%A7%80%EC%8A%A4%EB%A7%88%ED%8A%B8tv%EA%B1%B0%EC%B9%98%EB%8C%80/28/category/1/display/4/?icid=MAIN.product_listmain_3',
  },
];

const INDUSTRY_OPTIONS: Array<{ key: MockupIndustry; label: string }> = [
  { key: 'flower', label: '꽃집' },
  { key: 'bakery', label: '베이커리' },
  { key: 'lifestyle', label: '소품샵' },
  { key: 'fashion', label: '옷가게' },
  { key: 'optical', label: '안경점' },
  { key: 'nail', label: '네일샵' },
  { key: 'restaurant', label: '음식점' },
  { key: 'hospital', label: '병원' },
  { key: 'other', label: '그외' },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getDragBounds = (
  containerWidth: number,
  containerHeight: number,
  overlayWidth: number,
  overlayHeight: number,
) => ({
  minX: -overlayWidth * 0.5,
  maxX: containerWidth - overlayWidth * 0.5,
  minY: -overlayHeight * 0.5,
  maxY: containerHeight - overlayHeight * 0.5,
});

function useLoadedImage(src: string | null, fallbackSrc?: string): LoadedImage | null {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);

  useEffect(() => {
    if (!src) {
      setLoaded(null);
      return;
    }

    let isCancelled = false;

    const load = (targetSrc: string, onError?: () => void) => {
      const img = new window.Image();
      img.src = targetSrc;
      img.onload = () => {
        if (!isCancelled) {
          setLoaded({ src: targetSrc, width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        if (!isCancelled) onError?.();
      };
    };

    load(src, () => {
      if (fallbackSrc && fallbackSrc !== src) {
        load(fallbackSrc);
      } else {
        setLoaded(null);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [src, fallbackSrc]);

  return loaded;
}

export default function StorefrontEditor() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [editorWidth, setEditorWidth] = useState(320);
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);
  const [tvScale, setTvScale] = useState(0.7);
  const [tvPosition, setTvPosition] = useState({ x: 120, y: 220 });
  const [isDragging, setIsDragging] = useState(false);
  const [mockupIndustry, setMockupIndustry] = useState<MockupIndustry>('bakery');
  const [mockupOrientation, setMockupOrientation] = useState<MockupOrientation>('horizontal');

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<WoobPackage | null>(null);

  const selectedMockupSrc = useMemo(
    () => `/mockups/${mockupIndustry}-${mockupOrientation}.png`,
    [mockupIndustry, mockupOrientation],
  );
  const overlayImage = useLoadedImage(selectedMockupSrc, FALLBACK_MOCKUP_SRC);
  const backgroundImage = useLoadedImage(uploadSrc);
  const shouldShowPackageSection = Boolean(uploadSrc);

  useEffect(() => {
    persistUtmParams();
    trackMetaPageView();

    const resize = () => {
      if (!editorRef.current) return;
      setEditorWidth(Math.max(280, Math.floor(editorRef.current.clientWidth)));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const editorHeight = useMemo(() => {
    if (!backgroundImage) return Math.floor(editorWidth * 0.7);
    return Math.max(240, Math.floor((backgroundImage.height / backgroundImage.width) * editorWidth));
  }, [backgroundImage, editorWidth]);

  const scaledOverlaySize = useMemo(() => {
    if (!overlayImage) return { width: 0, height: 0 };
    return {
      width: overlayImage.width * tvScale,
      height: overlayImage.height * tvScale,
    };
  }, [overlayImage, tvScale]);

  const onUploadButtonClick = () => {
    trackMetaCustomEvent('upload_storefront_photo_click');
  };

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setUploadSrc(localUrl);
    setTvPosition({ x: editorWidth * 0.35, y: editorHeight * 0.55 });
    trackMetaCustomEvent('upload_storefront_photo_success');
  };

  const onOverlayPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const container = editorRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = tvPosition.x;
    const baseY = tvPosition.y;
    let hasMoved = false;

    setIsDragging(true);

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const { minX, maxX, minY, maxY } = getDragBounds(
        rect.width,
        rect.height,
        scaledOverlaySize.width,
        scaledOverlaySize.height,
      );

      const nextX = clamp(baseX + deltaX, minX, maxX);
      const nextY = clamp(baseY + deltaY, minY, maxY);

      if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        hasMoved = true;
      }

      setTvPosition({ x: nextX, y: nextY });
    };

    const onUp = () => {
      setIsDragging(false);
      if (hasMoved) {
        trackMetaCustomEvent('mockup_dragged');
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useEffect(() => {
    if (!backgroundImage || !overlayImage) return;

    const { minX, maxX, minY, maxY } = getDragBounds(
      editorWidth,
      editorHeight,
      scaledOverlaySize.width,
      scaledOverlaySize.height,
    );

    setTvPosition((prev) => ({
      x: clamp(prev.x, minX, maxX),
      y: clamp(prev.y, minY, maxY),
    }));
  }, [backgroundImage, overlayImage, editorWidth, editorHeight, scaledOverlaySize.width, scaledOverlaySize.height]);

  const downloadImage = async () => {
    if (!backgroundImage || !overlayImage) return;

    const exportScale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(editorWidth * exportScale);
    canvas.height = Math.floor(editorHeight * exportScale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = new window.Image();
    bg.src = backgroundImage.src;
    await bg.decode();

    const overlay = new window.Image();
    overlay.src = overlayImage.src;
    await overlay.decode();

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      overlay,
      tvPosition.x * exportScale,
      tvPosition.y * exportScale,
      scaledOverlaySize.width * exportScale,
      scaledOverlaySize.height * exportScale,
    );

    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `woob-simulation-${Date.now()}.png`;
    anchor.click();

    trackMetaCustomEvent('simulation_image_downloaded');
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-4 pb-16 sm:p-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold text-woob-blue">우브(WooB) 매장 시뮬레이터</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
          우리 매장에 우브를 놓으면 어떤 모습일까요?
        </h1>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          매장 정면 사진 1장만 올리고, TV 배너를 직접 움직여보세요.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label
            onClick={onUploadButtonClick}
            className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            매장 사진 업로드
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
          <button
            type="button"
            onClick={downloadImage}
            disabled={!backgroundImage}
            className="rounded-xl bg-woob-blue px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            결과 이미지 PNG 다운로드
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-woob-sky p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">업종 선택</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_OPTIONS.map((industry) => (
                <button
                  key={industry.key}
                  type="button"
                  onClick={() => {
                    if (mockupIndustry === industry.key) return;
                    setMockupIndustry(industry.key);
                    trackMetaCustomEvent('industry_selected', { industry: industry.key });
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mockupIndustry === industry.key
                      ? 'bg-woob-blue text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {industry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-woob-sky p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">디스플레이 방향</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (mockupOrientation === 'horizontal') return;
                  setMockupOrientation('horizontal');
                  trackMetaCustomEvent('display_orientation_selected', { orientation: 'horizontal' });
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mockupOrientation === 'horizontal'
                    ? 'bg-woob-blue text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                가로형
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mockupOrientation === 'vertical') return;
                  setMockupOrientation('vertical');
                  trackMetaCustomEvent('display_orientation_selected', { orientation: 'vertical' });
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mockupOrientation === 'vertical'
                    ? 'bg-woob-blue text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                세로형
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-woob-sky p-4">
          <label htmlFor="tv-scale" className="mb-2 block text-sm font-medium text-slate-700">
            TV 크기 조절
          </label>
          <input
            id="tv-scale"
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.01}
            value={tvScale}
            onChange={(e) => setTvScale(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div
          ref={editorRef}
          className="relative mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
          style={{ height: `${editorHeight}px` }}
        >
          {backgroundImage ? (
            <img
              src={backgroundImage.src}
              alt="업로드한 매장 사진"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          ) : null}

          {overlayImage && backgroundImage ? (
            <div
              role="button"
              aria-label="TV 오버레이 드래그"
              onPointerDown={onOverlayPointerDown}
              className={`absolute touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                left: `${tvPosition.x}px`,
                top: `${tvPosition.y}px`,
                width: `${scaledOverlaySize.width}px`,
                height: `${scaledOverlaySize.height}px`,
                touchAction: 'none',
              }}
            >
              <img
                src={overlayImage.src}
                alt="TV 오버레이"
                className="pointer-events-none h-full w-full"
                draggable={false}
              />
            </div>
          ) : null}

          {!backgroundImage ? (
            <p className="p-4 text-center text-sm text-slate-600">
              사진을 업로드하면 이 영역에서 TV 배너를 드래그/확대하여 시안을 확인할 수 있습니다.
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          목업은 손가락으로 끌어서 원하는 위치에 배치할 수 있어요.
        </p>

        <button
          type="button"
          onClick={() => {
            setIsRequestModalOpen(true);
            trackMetaCustomEvent('consultation_modal_opened');
          }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-woob-blue px-4 py-3 text-sm font-semibold text-woob-blue hover:bg-blue-50 sm:w-auto"
        >
          무료 상담 신청
        </button>
      </section>

      {isRequestModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="request-modal-title" className="text-xl font-bold text-slate-900">
                무료 상담 신청
              </h2>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="모달 닫기"
              >
                닫기
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              지금 만든 시뮬레이션 이미지를 저장한 뒤, 상담 신청 폼에 첨부해 주세요.
              {'\n'}
              담당자가 실제 설치 가능 위치와 무료 시안을 함께 확인해 드립니다.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={downloadImage}
                disabled={!backgroundImage}
                className="rounded-lg bg-woob-blue px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                시뮬레이션 이미지 저장하기
              </button>
              <a
                href="/consult"
                onClick={() => trackMetaCustomEvent('consultation_form_click')}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                무료 상담 신청 폼 작성하기
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {shouldShowPackageSection ? (
        <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-woob-blue">추천 패키지</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                우브 패키지별 구성
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                시뮬레이션 결과를 바탕으로 매장에 맞는 패키지를 비교해 보세요.
              </p>
            </div>
            <a
              href="/consult"
              onClick={() => trackMetaCustomEvent('consultation_form_click', { source: 'package_section_cta' })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-woob-blue px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
            >
              무료 상담 신청
            </a>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {WOOB_PACKAGES.map((pkg) => (
              <article
                key={pkg.key}
                className={`relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  pkg.isRecommended ? 'border-woob-blue ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {pkg.isRecommended ? (
                  <span className="absolute right-4 top-4 rounded-full bg-woob-blue px-3 py-1 text-xs font-bold text-white">
                    추천
                  </span>
                ) : null}
                <h3 className="pr-14 text-xl font-bold text-slate-900">{pkg.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600">{pkg.description}</p>
                <div className="mt-5 rounded-xl bg-woob-sky p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-woob-blue">구성</p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">{pkg.composition}</p>
                </div>
                <div className="mt-5">
                  <p className="text-sm text-slate-500">정가</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{pkg.price}</p>
                  <p className="mt-3 text-lg font-bold text-woob-blue">{pkg.monthly}</p>
                  <p className="mt-1 text-xs text-slate-500">*12개월 할부 기준</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackage(pkg);
                    trackMetaCustomEvent('package_detail_opened', { package: pkg.key });
                  }}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-woob-blue px-4 py-3 text-sm font-semibold text-woob-blue transition hover:bg-blue-50"
                >
                  패키지 상세 보기
                </button>
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            ※ TV 색상과 사이즈 옵션, 설치 환경에 따라 실제 결제 금액은 달라질 수 있습니다.
          </p>
        </section>
      ) : null}

      {selectedPackage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="package-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-woob-blue">패키지 상세</p>
                <h2 id="package-modal-title" className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedPackage.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="패키지 상세 팝업 닫기"
              >
                닫기
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{selectedPackage.description}</p>
            <div className="mt-5 rounded-xl bg-woob-sky p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-woob-blue">구성</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">
                {selectedPackage.composition}
              </p>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">정가</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{selectedPackage.price}</p>
              <p className="mt-3 text-lg font-bold text-woob-blue">{selectedPackage.monthly}</p>
              <p className="mt-1 text-xs text-slate-500">*12개월 할부 기준</p>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <a
                href="/consult"
                onClick={() =>
                  trackMetaCustomEvent('consultation_form_click', {
                    source: 'package_detail_modal',
                    package: selectedPackage.key,
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-woob-blue px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
              >
                이 패키지로 상담 신청
              </a>
              <a
                href={selectedPackage.detailHref}
                onClick={() => trackMetaCustomEvent('package_mall_detail_click', { package: selectedPackage.key })}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                우브몰에서 자세히 보기
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="mt-8 space-y-2 rounded-2xl bg-white p-5 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200 sm:p-6">
        <p>
          개인정보 고지: 본 페이지는 브라우저 내에서만 이미지를 처리하며, 업로드한 매장 사진은 서버에 저장되지
          않습니다.
        </p>
        <p>
          설치 안내: 시뮬레이션 결과는 이해를 돕기 위한 예시이며, 실제 설치 가능 여부/크기/위치는 현장 실측 및
          구조 점검 후 최종 확정됩니다.
        </p>
      </footer>
    </main>
  );
}
