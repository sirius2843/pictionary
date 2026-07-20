import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES, type Category } from '@/words'
import { Button } from '@/components/ui/button'

interface DrawnCard {
  key: string
  word: string
  cat: Category
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function wordFontClass(word: string): string {
  const len = word.length
  if (len <= 3) return 'text-6xl md:text-7xl'
  if (len <= 4) return 'text-5xl md:text-6xl'
  if (len <= 5) return 'text-4xl md:text-5xl'
  return 'text-3xl md:text-4xl'
}

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(CATEGORIES.map((c) => c.id)),
  )
  const [used, setUsed] = useState<Set<string>>(new Set())
  const [card, setCard] = useState<DrawnCard | null>(null)
  const [flipped, setFlipped] = useState(false)

  const activeCats = useMemo(
    () => CATEGORIES.filter((c) => selectedIds.has(c.id)),
    [selectedIds],
  )

  const totalPool = useMemo(
    () => activeCats.flatMap((c) => c.words.map((w) => ({ word: w, cat: c }))),
    [activeCats],
  )

  const drawNext = useCallback(
    (usedSet: Set<string>, pool: { word: string; cat: Category }[]) => {
      let available = pool.filter((p) => !usedSet.has(p.word))
      let nextUsed = usedSet
      if (available.length === 0) {
        // 牌池耗尽：自动洗回
        nextUsed = new Set<string>()
        available = pool
      }
      const picked = shuffle(available)[0]
      setUsed(nextUsed)
      setFlipped(false)
      setCard(
        picked
          ? { key: `${picked.word}-${Date.now()}`, word: picked.word, cat: picked.cat }
          : null,
      )
    },
    [],
  )

  // 初始 + 类目变化时抽一张
  useEffect(() => {
    if (totalPool.length > 0) drawNext(used, totalPool)
    else {
      setCard(null)
      setFlipped(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPool])

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // 至少保留一个
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const flipCard = () => {
    if (!card || flipped) return
    setFlipped(true)
    setUsed((u) => new Set(u).add(card.word))
  }

  const remaining = totalPool.filter((p) => !used.has(p.word)).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-slate-100 pb-10">
      <style>{`
        .flip-card { perspective: 1200px; }
        .flip-inner {
          position: relative; width: 100%; height: 100%;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-inner { transform: rotateY(180deg); }
        .flip-face {
          position: absolute; inset: 0;
          backface-visibility: hidden; -webkit-backface-visibility: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          border-radius: 1.5rem;
        }
        .flip-back { transform: rotateY(180deg); }
      `}</style>

      <div className="mx-auto max-w-xl px-4 pt-6">
        {/* 顶栏 */}
        <header className="text-center">
          <h1 className="text-2xl md:text-3xl font-black tracking-wide">
            🎨 你画我猜 · 抽词
          </h1>
          <p className="mt-1 text-sm text-slate-400">点牌翻词，轮到谁谁抽</p>
        </header>

        {/* 类目选择 */}
        <section className="mt-5">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => {
              const on = selectedIds.has(c.id)
              const isAdult = !!c.adult
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold border transition-all ${
                    on
                      ? isAdult
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-900/40'
                        : 'bg-amber-400 text-slate-900 border-amber-300 shadow-md shadow-amber-900/40'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {c.emoji} {c.name}
                  <span className="ml-1 text-xs opacity-70">{c.words.length}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 抽牌区 */}
        <section className="mt-8 flex flex-col items-center">
          {card ? (
            <div
              key={card.key}
              className={`flip-card w-64 h-88 md:w-72 md:h-96 cursor-pointer select-none ${flipped ? 'flipped' : ''}`}
              style={{ height: '22rem' }}
              onClick={flipCard}
            >
              <div className="flip-inner">
                {/* 牌面（未翻） */}
                <div className="flip-face bg-gradient-to-br from-violet-600 to-indigo-700 border-2 border-violet-400/50 shadow-2xl shadow-indigo-950/60 hover:scale-[1.03] transition-transform">
                  <span className="text-8xl font-black text-violet-200/90">?</span>
                  <span className="mt-4 text-sm text-violet-200/60">点击翻牌</span>
                </div>
                {/* 牌背（词条） */}
                <div
                  className={`flip-face flip-back border-2 shadow-2xl px-4 text-center ${
                    card.cat.adult
                      ? 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-300/60 shadow-rose-950/60'
                      : 'bg-gradient-to-br from-amber-300 to-orange-400 border-amber-200/70 shadow-amber-950/50 text-slate-900'
                  }`}
                >
                  <span
                    className={`font-black leading-tight ${wordFontClass(card.word)} ${
                      card.cat.adult ? 'text-white' : ''
                    }`}
                  >
                    {card.word}
                  </span>
                  <span
                    className={`mt-4 text-sm font-semibold ${
                      card.cat.adult ? 'text-rose-100/80' : 'text-slate-700/70'
                    }`}
                  >
                    {card.cat.emoji} {card.cat.name}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 py-24">没有可用词条，请至少选择一个类目</p>
          )}

          {/* 控制区 */}
          <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
            <Button
              size="lg"
              onClick={() => drawNext(used, totalPool)}
              disabled={!card}
              className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-lg px-10"
            >
              🔄 下一张
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => drawNext(new Set(), totalPool)}
              disabled={!card}
              className="border-slate-600 text-slate-300 font-bold"
            >
              ♻️ 重置牌库
            </Button>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            剩余词条 <b className="text-amber-300">{remaining}</b> / {totalPool.length}
          </p>
          <p className="mt-1 text-center text-xs text-slate-500">
            翻过的词不会重复出现，全部抽完自动洗回
          </p>
        </section>
      </div>
    </div>
  )
}
