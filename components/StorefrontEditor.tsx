'use client';

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

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

  const selectedMockupSrc = useMemo(
    () => `/mockups/${mockupIndustry}-${mockupOrientation}.png`,
    [mockupIndustry, mockupOrientation],
  );
  const overlayImage = useLoadedImage(selectedMockupSrc, FALLBACK_MOCKUP_SRC);
  const backgroundImage = useLoadedImage(uploadSrc);

  useEffect(() => {
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

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setUploadSrc(localUrl);
    setTvPosition({ x: editorWidth * 0.35, y: editorHeight * 0.55 });
  };

  const onOverlayPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = editorRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = tvPosition.x;
    const baseY = tvPosition.y;

    setIsDragging(true);

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const nextX = Math.max(0, Math.min(baseX + deltaX, rect.width - scaledOverlaySize.width));
      const nextY = Math.max(0, Math.min(baseY + deltaY, rect.height - scaledOverlaySize.height));

      setTvPosition({ x: nextX, y: nextY });
    };

    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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
  };

  const requestFormUrl =
    'https://thealt.notion.site/29a1bf73c34d815cb242de566247d572?pvs=105';

  const onOpenRequestForm = () => {
    window.open(requestFormUrl, '_blank', 'noopener,noreferrer');
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
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
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
                  onClick={() => setMockupIndustry(industry.key)}
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
                onClick={() => setMockupOrientation('horizontal')}
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
                onClick={() => setMockupOrientation('vertical')}
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

        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
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
              <button
                type="button"
                onClick={onOpenRequestForm}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                무료 상담 신청 폼 작성하기
              </button>
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
