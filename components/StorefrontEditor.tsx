"use client";

import {
  ChangeEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  persistUtmParams,
  trackMetaCustomEvent,
  trackMetaPageView,
} from "@/lib/metaPixel";

type LoadedImage = {
  src: string;
  width: number;
  height: number;
};

type MockupOrientation = "horizontal" | "vertical";
type MockupIndustry =
  | "flower"
  | "bakery"
  | "lifestyle"
  | "fashion"
  | "optical"
  | "nail"
  | "restaurant"
  | "hospital"
  | "other";

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.8;

const FALLBACK_MOCKUP_SRC = "/mockups/bakery-horizontal.png";

type RecommendedPackage = {
  name: string;
  summary: string;
  price: string;
  details: string[];
};

const RECOMMENDED_PACKAGES: RecommendedPackage[] = [
  {
    name: "스탠다드 패키지",
    summary: "처음 디지털 사이니지를 도입하는 매장에 적합한 기본 구성",
    price: "월 9만원대부터",
    details: [
      "디스플레이 1대 기준 구성",
      "매장 분위기에 맞춘 기본 콘텐츠 세팅",
      "설치 가능 위치 상담 포함",
    ],
  },
  {
    name: "브랜딩 패키지",
    summary: "시즌 프로모션과 브랜드 무드를 함께 보여주고 싶은 매장 추천",
    price: "월 15만원대부터",
    details: [
      "디스플레이 및 콘텐츠 운영 구성",
      "프로모션/메뉴/이벤트 화면 활용",
      "브랜드 톤에 맞춘 시안 상담 포함",
    ],
  },
  {
    name: "맞춤 상담 패키지",
    summary: "매장 구조와 설치 위치에 맞춰 별도 견적이 필요한 경우",
    price: "상담 후 안내",
    details: [
      "복수 디스플레이 또는 특수 설치 상담",
      "현장 조건에 따른 맞춤 구성",
      "운영 목적에 맞춘 패키지 제안",
    ],
  },
];

const INDUSTRY_OPTIONS: Array<{ key: MockupIndustry; label: string }> = [
  { key: "flower", label: "꽃집" },
  { key: "bakery", label: "베이커리" },
  { key: "lifestyle", label: "소품샵" },
  { key: "fashion", label: "옷가게" },
  { key: "optical", label: "안경점" },
  { key: "nail", label: "네일샵" },
  { key: "restaurant", label: "음식점" },
  { key: "hospital", label: "병원" },
  { key: "other", label: "그외" },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

function useLoadedImage(
  src: string | null,
  fallbackSrc?: string,
): LoadedImage | null {
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
  const [mockupIndustry, setMockupIndustry] =
    useState<MockupIndustry>("bakery");
  const [mockupOrientation, setMockupOrientation] =
    useState<MockupOrientation>("horizontal");

  const [activePackage, setActivePackage] = useState<RecommendedPackage | null>(
    null,
  );

  const selectedMockupSrc = useMemo(
    () => `/mockups/${mockupIndustry}-${mockupOrientation}.png`,
    [mockupIndustry, mockupOrientation],
  );
  const overlayImage = useLoadedImage(selectedMockupSrc, FALLBACK_MOCKUP_SRC);
  const backgroundImage = useLoadedImage(uploadSrc);
  const hasSimulationResult = Boolean(backgroundImage && overlayImage);

  useEffect(() => {
    persistUtmParams();
    trackMetaPageView();

    const resize = () => {
      if (!editorRef.current) return;
      setEditorWidth(Math.max(280, Math.floor(editorRef.current.clientWidth)));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const editorHeight = useMemo(() => {
    if (!backgroundImage) return Math.floor(editorWidth * 0.7);
    return Math.max(
      240,
      Math.floor(
        (backgroundImage.height / backgroundImage.width) * editorWidth,
      ),
    );
  }, [backgroundImage, editorWidth]);

  const scaledOverlaySize = useMemo(() => {
    if (!overlayImage) return { width: 0, height: 0 };
    return {
      width: overlayImage.width * tvScale,
      height: overlayImage.height * tvScale,
    };
  }, [overlayImage, tvScale]);

  const onUploadButtonClick = () => {
    trackMetaCustomEvent("upload_storefront_photo_click");
  };

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setUploadSrc(localUrl);
    setTvPosition({ x: editorWidth * 0.35, y: editorHeight * 0.55 });
    trackMetaCustomEvent("upload_storefront_photo_success");
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
        trackMetaCustomEvent("mockup_dragged");
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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
  }, [
    backgroundImage,
    overlayImage,
    editorWidth,
    editorHeight,
    scaledOverlaySize.width,
    scaledOverlaySize.height,
  ]);

  const downloadImage = async () => {
    if (!backgroundImage || !overlayImage) return;

    const exportScale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(editorWidth * exportScale);
    canvas.height = Math.floor(editorHeight * exportScale);

    const ctx = canvas.getContext("2d");
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

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = `woob-simulation-${Date.now()}.png`;
    anchor.click();

    trackMetaCustomEvent("simulation_image_downloaded");
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-4 pb-16 sm:p-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm font-semibold text-woob-blue">
          우브(WooB) 매장 시뮬레이터
        </p>
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
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
            />
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
                    trackMetaCustomEvent("industry_selected", {
                      industry: industry.key,
                    });
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    mockupIndustry === industry.key
                      ? "bg-woob-blue text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {industry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-woob-sky p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">
              디스플레이 방향
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (mockupOrientation === "horizontal") return;
                  setMockupOrientation("horizontal");
                  trackMetaCustomEvent("display_orientation_selected", {
                    orientation: "horizontal",
                  });
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mockupOrientation === "horizontal"
                    ? "bg-woob-blue text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                가로형
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mockupOrientation === "vertical") return;
                  setMockupOrientation("vertical");
                  trackMetaCustomEvent("display_orientation_selected", {
                    orientation: "vertical",
                  });
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mockupOrientation === "vertical"
                    ? "bg-woob-blue text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                세로형
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-woob-sky p-4">
          <label
            htmlFor="tv-scale"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
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
              className={`absolute touch-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{
                left: `${tvPosition.x}px`,
                top: `${tvPosition.y}px`,
                width: `${scaledOverlaySize.width}px`,
                height: `${scaledOverlaySize.height}px`,
                touchAction: "none",
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
              사진을 업로드하면 이 영역에서 TV 배너를 드래그/확대하여 시안을
              확인할 수 있습니다.
            </p>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          목업은 손가락으로 끌어서 원하는 위치에 배치할 수 있어요.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="/consult"
            onClick={() => trackMetaCustomEvent("consultation_form_click")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-woob-blue px-4 py-3 text-sm font-semibold text-woob-blue hover:bg-blue-50 sm:w-auto"
          >
            무료 상담 신청
          </a>
          <button
            type="button"
            onClick={downloadImage}
            disabled={!backgroundImage}
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-auto"
          >
            시뮬레이션 이미지 저장하기
          </button>
        </div>
      </section>

      {hasSimulationResult ? (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-woob-blue">
                시뮬레이션 결과 기반 추천
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                추천 패키지 &amp; 예상 가격
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              실제 견적은 매장 환경과 설치 조건에 따라 달라질 수 있어요.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {RECOMMENDED_PACKAGES.map((item) => (
              <article
                key={item.name}
                className="flex h-full flex-col rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.summary}
                  </p>
                  <p className="mt-4 text-xl font-extrabold text-woob-blue">
                    {item.price}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActivePackage(item);
                    trackMetaCustomEvent("package_detail_opened", {
                      packageName: item.name,
                    });
                  }}
                  className="mt-5 rounded-xl bg-woob-blue px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  패키지 상세 보기
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activePackage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="package-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-woob-blue">
                  추천 패키지
                </p>
                <h2
                  id="package-modal-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {activePackage.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePackage(null)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="패키지 상세 닫기"
              >
                닫기
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {activePackage.summary}
            </p>
            <p className="mt-4 text-2xl font-extrabold text-woob-blue">
              {activePackage.price}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {activePackage.details.map((detail) => (
                <li key={detail} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-woob-blue" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2">
              <a
                href="/consult"
                onClick={() => trackMetaCustomEvent("consultation_form_click")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-woob-blue px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                이 패키지로 상담 신청
              </a>
              <a
                href="https://www.woob.life"
                onClick={() =>
                  trackMetaCustomEvent("woobmall_detail_click", {
                    packageName: activePackage.name,
                  })
                }
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
          개인정보 고지: 본 페이지는 브라우저 내에서만 이미지를 처리하며,
          업로드한 매장 사진은 서버에 저장되지 않습니다.
        </p>
        <p>
          설치 안내: 시뮬레이션 결과는 이해를 돕기 위한 예시이며, 실제 설치 가능
          여부/크기/위치는 현장 실측 및 구조 점검 후 최종 확정됩니다.
        </p>
      </footer>
    </main>
  );
}
