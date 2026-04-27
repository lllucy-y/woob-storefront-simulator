import dynamic from 'next/dynamic';

const StorefrontEditor = dynamic(() => import('@/components/StorefrontEditor'), {
  ssr: false,
  loading: () => (
    <main className="mx-auto w-full max-w-5xl p-4 pb-16 sm:p-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <p className="text-sm text-slate-600">에디터를 불러오는 중...</p>
      </section>
    </main>
  ),
});

export default function HomePage() {
  return <StorefrontEditor />;
}
