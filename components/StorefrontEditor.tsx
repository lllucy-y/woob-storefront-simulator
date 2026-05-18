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

type PackageKey = "light" | "standard" | "premium";

type WoobPackage = {
  key: PackageKey;
  title: string;
  badge?: string;
  resultDescription: string;
  summary: string;
  modalSubtitle: string;
  modalItems: string[];
  monthlyPrice: string;
  listPrice: string;
  mallUrl: string;
  emphasis: "default" | "recommended" | "subtle";
};

const CONSULTATION_FORM_URL = "/consult";

const PRICE_NOTICE =
  "TV 색상과 사이즈 옵션, 설치 환경에 따라 실제 결제 금액은 달라질 수 있습니다.";

const WOOB_PACKAGES: WoobPackage[] = [
  {
    key: "light",
    title: "라이트 패키지",
    resultDescription:
      "처음 디지털 사이니지를 도입하는 매장에 적합한 기본 구성",
    summary: "홍보 영상 1종 + 스마트TV + 이동식 거치대",
    modalSubtitle: "소형 매장 시작용",
    modalItems: [
      "홍보 영상 1종",
      "32인치 스마트TV + 이동식 거치대",
      "처음 테스트하는 매장에 추천",
      "기본 구성으로 빠르게 시작",
    ],
    monthlyPrice: "월 8만원대부터",
    listPrice: "968,000원",
    mallUrl:
      "https://www.woob.life/product/%EB%9D%BC%EC%9D%B4%ED%8A%B8-%ED%8C%A8%ED%82%A4%EC%A7%80-%ED%99%8D%EB%B3%B4-%EC%98%81%EC%83%81-1%EC%A2%8580%EC%B4%88-%EB%82%B4%EC%99%B8-%EC%8A%A4%EB%A7%88%ED%8A%B8-tv%EA%B1%B0%EC%B9%98%EB%8C%80/27/category/1/display/4/?icid=MAIN.product_listmain_3",
    emphasis: "default",
  },
  {
    key: "standard",
    title: "스탠다드 패키지",
    badge: "추천",
    resultDescription: "시즌·이벤트 홍보까지 운영하기 좋은 추천 구성",
    summary: "홍보 영상 2종 + 스마트TV + 이동식 거치대",
    modalSubtitle: "가장 많이 선택하는 기본 추천 패키지",
    modalItems: [
      "홍보 영상 2종",
      "32인치 스마트TV + 이동식 거치대",
      "시즌/이벤트 홍보까지 운영하기 좋음",
      "가장 균형 잡힌 추천 구성",
    ],
    monthlyPrice: "월 9만원대부터",
    listPrice: "1,089,000원",
    mallUrl:
      "https://www.woob.life/product/%EC%8A%A4%ED%83%A0%EB%8B%A4%EB%93%9C-%ED%8C%A8%ED%82%A4%EC%A7%80-%ED%99%8D%EB%B3%B4-%EC%98%81%EC%83%81-2%EC%A2%85%EA%B0%81-80%EC%B4%88-%EB%82%B4%EC%99%B8%EC%8A%A4%EB%A7%88%ED%8A%B8tv%EC%9D%B4%EB%8F%99%EC%8B%9D%EA%B1%B0%EC%B9%98%EB%8C%80/37/category/1/display/4/?icid=MAIN.product_listmain_3",
    emphasis: "recommended",
  },
  {
    key: "premium",
    title: "프리미엄 패키지",
    resultDescription: "매장 전용 홈페이지까지 함께 필요한 브랜딩 구성",
    summary: "홍보 영상 2종 + 매장 전용 홈페이지 + 스마트TV + 이동식 거치대",
    modalSubtitle: "브랜드페이지까지 필요한 매장",
    modalItems: [
      "홍보 영상 2종",
      "매장 전용 홈페이지",
      "32인치 스마트TV + 이동식 거치대",
      "예약/안내/브랜딩 동선까지 함께 필요한 매장에 추천",
    ],
    monthlyPrice: "월 15만원대부터",
    listPrice: "1,815,000원",
    mallUrl:
      "https://www.woob.life/product/%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84-%ED%8C%A8%ED%82%A4%EC%A7%80-%ED%99%8D%EB%B3%B4-%EC%98%81%EC%83%81-2%EC%A2%85%EA%B0%8180%EC%B4%88-%EB%82%B4%EC%99%B8%EB%A7%A4%EC%9E%A5%EC%A0%84%EC%9A%A9%ED%99%88%ED%8E%98%EC%9D%B4%EC%A7%80%EC%8A%A4%EB%A7%88%ED%8A%B8tv%EA%B1%B0%EC%B9%98%EB%8C%80/28/category/1/display/4/?icid=MAIN.product_listmain_3",
    emphasis: "subtle",
  },
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

  const [selectedPackageKey, setSelectedPackageKey] =
    useState<PackageKey | null>(null);

  const selectedMockupSrc = useMemo(
    () => `/mockups/${mockupIndustry}-${mockupOrientation}.png`,
    [mockupIndustry, mockupOrientation],
  );
  const overlayImage = useLoadedImage(selectedMockupSrc, FALLBACK_MOCKUP_SRC);
  const backgroundImage = useLoadedImage(uploadSrc);

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

  const selectedPackage = useMemo(
    () =>
      WOOB_PACKAGES.find(
        (woobPackage) => woobPackage.key === selectedPackageKey,
      ) ?? WOOB_PACKAGES[1],
    [selectedPackageKey],
  );

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

        <a
          href={CONSULTATION_FORM_URL}
          onClick={() => trackMetaCustomEvent("consultation_form_click")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-woob-blue px-4 py-3 text-sm font-semibold text-woob-blue hover:bg-blue-50 sm:w-auto"
        >
          무료 상담 신청
        </a>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-woob-blue">
              추천 패키지 & 예상 가격
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              우브몰 실제 패키지 구성
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            *12개월 할부 기준 월 환산 금액입니다.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {WOOB_PACKAGES.map((woobPackage) => {
            const isRecommended = woobPackage.emphasis === "recommended";
            const isSubtle = woobPackage.emphasis === "subtle";

            return (
              <article
                key={woobPackage.key}
                className={`relative flex h-full flex-col rounded-2xl border p-5 shadow-sm transition ${
                  isRecommended
                    ? "border-woob-blue bg-blue-50/70 shadow-blue-100"
                    : isSubtle
                      ? "border-indigo-200 bg-indigo-50/40"
                      : "border-slate-200 bg-white"
                }`}
              >
                {woobPackage.badge ? (
                  <span className="absolute right-4 top-4 rounded-full bg-woob-blue px-3 py-1 text-xs font-bold text-white">
                    {woobPackage.badge}
                  </span>
                ) : null}
                <h3 className="pr-16 text-xl font-bold text-slate-900">
                  {woobPackage.title}
                </h3>
                <p className="mt-3 min-h-12 text-sm leading-relaxed text-slate-600">
                  {woobPackage.resultDescription}
                </p>
                <div className="mt-4 rounded-xl bg-white/80 p-4 ring-1 ring-slate-200/70">
                  <p className="text-xs font-semibold text-slate-500">
                    구성 요약
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {woobPackage.summary}
                  </p>
                </div>
                <div className="mt-5">
                  <p className="text-2xl font-extrabold text-slate-950">
                    {woobPackage.monthlyPrice}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    *12개월 할부 기준
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    정가 {woobPackage.listPrice}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPackageKey(woobPackage.key);
                    trackMetaCustomEvent("package_detail_opened", {
                      package: woobPackage.key,
                    });
                  }}
                  className={`mt-6 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    isRecommended
                      ? "bg-woob-blue text-white hover:bg-blue-700"
                      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  패키지 상세 보기
                </button>
              </article>
            );
          })}
        </div>

        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          ※ {PRICE_NOTICE}
        </p>
      </section>

      {selectedPackageKey ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="package-detail-title"
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-woob-blue">
                  패키지 상세 보기
                </p>
                <h2
                  id="package-detail-title"
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  선택한 패키지: {selectedPackage.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPackageKey(null)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="패키지 상세 팝업 닫기"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {WOOB_PACKAGES.map((woobPackage) => {
                const isSelected = selectedPackageKey === woobPackage.key;
                const isRecommended = woobPackage.emphasis === "recommended";

                return (
                  <button
                    type="button"
                    key={woobPackage.key}
                    onClick={() => setSelectedPackageKey(woobPackage.key)}
                    className={`flex h-full flex-col rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-woob-blue bg-blue-50 shadow-lg shadow-blue-100 ring-2 ring-woob-blue/20"
                        : isRecommended
                          ? "border-blue-200 bg-blue-50/50 hover:border-woob-blue"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex min-h-14 items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {woobPackage.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {woobPackage.modalSubtitle}
                        </p>
                      </div>
                      {woobPackage.badge ? (
                        <span className="rounded-full bg-woob-blue px-3 py-1 text-xs font-bold text-white">
                          {woobPackage.badge}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-5 space-y-2 text-sm leading-relaxed text-slate-700">
                      {woobPackage.modalItems.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-woob-blue" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-5">
                      <p className="text-sm font-semibold text-slate-600">
                        정가 {woobPackage.listPrice}
                      </p>
                      <p className="mt-2 text-2xl font-extrabold text-slate-950">
                        {woobPackage.monthlyPrice}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        *12개월 할부 기준
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              <p>
                정확한 금액은 TV 색상과 사이즈 옵션, 설치 환경에 따라 달라질 수
                있습니다.
              </p>
              <p className="mt-1">
                상세 옵션은 우브몰 각 패키지 페이지에서 확인할 수 있어요.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={CONSULTATION_FORM_URL}
                onClick={() =>
                  trackMetaCustomEvent("consultation_form_click", {
                    package: selectedPackage.key,
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-woob-blue px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
              >
                이 패키지로 상담 신청
              </a>
              <a
                href={selectedPackage.mallUrl}
                onClick={() =>
                  trackMetaCustomEvent("woob_mall_detail_click", {
                    package: selectedPackage.key,
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-800 hover:bg-slate-50"
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
