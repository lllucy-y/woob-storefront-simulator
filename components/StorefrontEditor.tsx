'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Stage } from 'react-konva';
import type Konva from 'konva';

type LoadedImage = {
  element: HTMLImageElement;
  width: number;
  height: number;
};

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.8;

function useLoadedImage(src: string | null): LoadedImage | null {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);

  useEffect(() => {
    if (!src) {
      setLoaded(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => setLoaded({ element: img, width: img.width, height: img.height });
  }, [src]);

  return loaded;
}

export default function StorefrontEditor() {
  const stageRef = useRef<Konva.Stage>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [stageWidth, setStageWidth] = useState(320);
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);
  const [tvScale, setTvScale] = useState(0.7);
  const [tvPosition, setTvPosition] = useState({ x: 120, y: 220 });

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [business, setBusiness] = useState('');
  const [storeName, setStoreName] = useState('');

  const overlayImage = useLoadedImage('/woob-tv-overlay.svg');
  const backgroundImage = useLoadedImage(uploadSrc);

  useEffect(() => {
    const resize = () => {
      if (!editorRef.current) return;
      setStageWidth(Math.max(280, Math.floor(editorRef.current.clientWidth)));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const stageHeight = useMemo(() => {
    if (!backgroundImage) return Math.floor(stageWidth * 0.7);
    return Math.max(240, Math.floor((backgroundImage.height / backgroundImage.width) * stageWidth));
  }, [backgroundImage, stageWidth]);

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setUploadSrc(localUrl);
    setTvPosition({ x: stageWidth * 0.35, y: stageHeight * 0.55 });
  };

  const downloadImage = () => {
    if (!stageRef.current || !backgroundImage) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `woob-simulation-${Date.now()}.png`;
    anchor.click();
  };

  const requestFormUrl = useMemo(() => {
    const params = new URLSearchParams({
      name,
      contact,
      business,
      storeName,
    });
    return `https://forms.gle/REPLACE_ME?${params.toString()}`;
  }, [name, contact, business, storeName]);

  const onSubmitLead = (e: FormEvent) => {
    e.preventDefault();
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

        <div ref={editorRef} className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <Stage ref={stageRef} width={stageWidth} height={stageHeight} className="touch-pan-y">
            <Layer>
              {backgroundImage ? (
                <KonvaImage image={backgroundImage.element} width={stageWidth} height={stageHeight} listening={false} />
              ) : null}
              {overlayImage ? (
                <KonvaImage
                  image={overlayImage.element}
                  x={tvPosition.x}
                  y={tvPosition.y}
                  width={overlayImage.width * tvScale}
                  height={overlayImage.height * tvScale}
                  draggable
                  onDragEnd={(e) => setTvPosition({ x: e.target.x(), y: e.target.y() })}
                />
              ) : null}
            </Layer>
          </Stage>
          {!backgroundImage ? (
            <p className="p-4 text-center text-sm text-slate-600">
              사진을 업로드하면 이 영역에서 TV 배너를 드래그/확대하여 시안을 확인할 수 있습니다.
            </p>
          ) : null}
        </div>

        <a
          href="#request-form"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-woob-blue px-4 py-3 text-sm font-semibold text-woob-blue hover:bg-blue-50 sm:w-auto"
        >
          무료 시안 요청하기
        </a>
      </section>

      <section id="request-form" className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <h2 className="text-xl font-bold">무료 시안 요청 정보</h2>
        <p className="mt-1 text-sm text-slate-600">아래 정보를 입력하면 Google Form으로 이동합니다.</p>

        <form onSubmit={onSubmitLead} className="mt-5 grid gap-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="연락처"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="업종"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="매장명"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Google Form으로 제출하기
          </button>
        </form>
      </section>

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
