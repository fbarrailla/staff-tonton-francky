import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export interface AddressResult {
  address: string
  city: string | null
  country: string | null
  latitude: number
  longitude: number
}

interface PhotonFeature {
  type: 'Feature'
  geometry: { coordinates: [number, number] } // [lng, lat]
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    osm_value?: string
  }
}

interface PhotonResponse {
  features: PhotonFeature[]
}

function formatFeature(f: PhotonFeature): string {
  const p = f.properties
  const parts: string[] = []
  if (p.housenumber || p.street || p.name) {
    parts.push([p.housenumber, p.street ?? p.name].filter(Boolean).join(' '))
  }
  if (p.postcode || p.city) parts.push([p.postcode, p.city].filter(Boolean).join(' '))
  if (p.state && p.state !== p.city) parts.push(p.state)
  if (p.country) parts.push(p.country)
  return parts.filter(Boolean).join(', ')
}

interface Props {
  label?: string
  value: string
  onChange: (v: string) => void
  onSelect: (result: AddressResult) => void
  placeholder?: string
  hint?: string
  className?: string
}

export function AddressAutocomplete({
  label, value, onChange, onSelect, placeholder, hint, className,
}: Props) {
  const { t, i18n } = useTranslation()
  const [results, setResults] = useState<PhotonFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounced search to Photon (komoot OSM-based geocoder, no API key,
  // browser-friendly: no User-Agent requirement, generous rate limits)
  useEffect(() => {
    const q = value.trim()
    if (q.length < 3) { setResults([]); return }
    const id = setTimeout(async () => {
      setLoading(true)
      try {
        const lang = (i18n.resolvedLanguage || 'en').slice(0, 2)
        const url = `https://photon.komoot.io/api?q=${encodeURIComponent(q)}&limit=6&lang=${encodeURIComponent(lang)}`
        const r = await fetch(url)
        if (r.ok) {
          const json = (await r.json()) as PhotonResponse
          setResults(json.features ?? [])
          setHighlight(0)
        } else {
          setResults([])
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(id)
  }, [value, i18n.resolvedLanguage])

  // Click-outside closes the dropdown
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function pick(f: PhotonFeature) {
    const [lng, lat] = f.geometry.coordinates
    const formatted = formatFeature(f)
    onSelect({
      address: formatted,
      city: f.properties.city ?? f.properties.state ?? null,
      country: f.properties.country ?? null,
      latitude: lat,
      longitude: lng,
    })
    onChange(formatted)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {label && (
        <span className="block text-[12px] font-medium text-ink-soft mb-1.5 tracking-tightish">
          {label}
        </span>
      )}
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? t('address.placeholder')}
          className="w-full bg-paper border border-line rounded-md text-sm text-ink placeholder:text-ink-faint h-10 pl-9 pr-9 focus:border-tonton-500 focus:outline-none transition-colors"
          autoComplete="off"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint animate-spin" />
        )}
      </div>
      {hint && !open && (
        <span className="mt-1.5 block text-[12px] text-ink-faint">{hint}</span>
      )}

      {open && value.trim().length >= 3 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-64 overflow-y-auto nice-scroll rounded-md border border-line bg-paper shadow-raise animate-pop origin-top">
          {results.length === 0 && !loading ? (
            <div className="p-3 text-[12.5px] text-ink-faint text-center">
              {t('address.no_results')}
            </div>
          ) : (
            <ul>
              {results.map((f, i) => {
                const active = i === highlight
                const label = formatFeature(f)
                return (
                  <li key={`${f.geometry.coordinates.join(',')}-${i}`}>
                    <button
                      type="button"
                      onClick={() => pick(f)}
                      onMouseEnter={() => setHighlight(i)}
                      className={cn(
                        'w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors',
                        active ? 'bg-tonton-500/8' : 'hover:bg-surface/70',
                      )}
                    >
                      <MapPin size={13} className="mt-0.5 shrink-0 text-tonton-500" />
                      <span className="text-[12.5px] text-ink leading-snug truncate">
                        {label || f.properties.name || '—'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
