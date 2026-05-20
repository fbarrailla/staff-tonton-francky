import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEmployees } from '@/hooks/useStore'
import { useRoleLabel } from '@/hooks/useLabels'
import { useTheme } from '@/contexts/ThemeContext'
import { avatarColors, cn, initials } from '@/lib/utils'

// Carto basemaps — free, OSM-based, no API key. Voyager has a warm cream
// palette that pairs with the Tonton aesthetic; Dark Matter for night mode.
const TILES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_dark/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
}

export function TeamMap() {
  const { t } = useTranslation()
  const employees = useEmployees()
  const roleLabel = useRoleLabel()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null) // Leaflet Map instance
  const tileLayerRef = useRef<unknown>(null)
  const markersLayerRef = useRef<unknown>(null)
  const [ready, setReady] = useState(false)

  const located = useMemo(
    () => employees.filter((e) => e.latitude !== null && e.longitude !== null),
    [employees],
  )

  // Lazy-load Leaflet + its CSS only when the component renders. Saves ~150KB
  // off the initial bundle for users who never visit the Dashboard.
  useEffect(() => {
    let cancelled = false
    async function init() {
      // CSS
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.dataset.leaflet = '1'
        link.integrity =
          'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }
      // Module
      const L = await import('leaflet')
      if (cancelled || !containerRef.current) return
      if (mapRef.current) return // already initialised

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        worldCopyJump: true,
        attributionControl: true,
      }).setView([20, 0], 2)
      mapRef.current = map

      const tiles = TILES[theme === 'dark' ? 'dark' : 'light']
      tileLayerRef.current = L.tileLayer(tiles.url, {
        attribution: tiles.attribution,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      const layer = L.layerGroup().addTo(map)
      markersLayerRef.current = layer
      setReady(true)
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [theme])

  // Swap tile layer when the theme flips
  useEffect(() => {
    if (!ready) return
    void (async () => {
      const L = await import('leaflet')
      const map = mapRef.current as InstanceType<typeof L.Map> | null
      const layer = tileLayerRef.current as InstanceType<typeof L.TileLayer> | null
      if (!map || !layer) return
      map.removeLayer(layer)
      const tiles = TILES[theme === 'dark' ? 'dark' : 'light']
      tileLayerRef.current = L.tileLayer(tiles.url, {
        attribution: tiles.attribution,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)
    })()
  }, [theme, ready])

  // Refresh markers when employees change
  useEffect(() => {
    if (!ready) return
    void (async () => {
      const L = await import('leaflet')
      const map = mapRef.current as InstanceType<typeof L.Map> | null
      const layer = markersLayerRef.current as InstanceType<typeof L.LayerGroup> | null
      if (!map || !layer) return
      layer.clearLayers()
      if (located.length === 0) return

      located.forEach((emp) => {
        const [c1, c2] = avatarColors(emp.full_name)
        const init = initials(emp.full_name)
        const img = emp.avatar_url
          ? `<img src="${emp.avatar_url}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
          : `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:Fraunces,Georgia,serif;font-weight:700;color:white;font-size:12px;letter-spacing:.02em">${init}</span>`
        const html = `
          <div style="position:relative;width:36px;height:36px;border-radius:50%;
                      background:linear-gradient(135deg,${c1},${c2});
                      box-shadow:0 4px 12px -2px rgba(0,0,0,.4),0 0 0 2px white;
                      overflow:hidden;cursor:pointer">${img}</div>`
        const icon = L.divIcon({
          html,
          className: 'tf-pin',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -28],
        })
        const popupHtml = `
          <div style="font-family:Geist,system-ui,sans-serif;min-width:160px">
            <div style="font-weight:600;color:#2C2419;font-size:13px;line-height:1.2;margin-bottom:2px">
              ${emp.full_name}
            </div>
            <div style="font-size:11.5px;color:#5E4F3B;line-height:1.3">
              ${roleLabel(emp.role)}
            </div>
            ${(emp.city || emp.country) ? `<div style="font-size:11px;color:#9E8E77;margin-top:6px">${[emp.city, emp.country].filter(Boolean).join(' · ')}</div>` : ''}
          </div>`
        const m = L.marker([emp.latitude!, emp.longitude!], { icon }).addTo(layer)
        m.bindPopup(popupHtml, { closeButton: false })
        m.on('click', () => navigate(`/equipe/${emp.id}`))
      })

      // Auto-fit to all markers
      const bounds = L.latLngBounds(
        located.map((e) => [e.latitude!, e.longitude!] as [number, number]),
      )
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 })
      }
    })()
  }, [located, ready, navigate, roleLabel])

  return (
    <div className="surface-card overflow-hidden">
      <header className="px-5 pt-4 pb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="display text-[20px] text-ink inline-flex items-center gap-1.5">
            <Globe2 size={15} className="text-tonton-500" />
            {t('dashboard.map_title')}
          </h2>
          <p className="text-[12.5px] text-ink-soft mt-0.5">
            {t('dashboard.map_subtitle', { count: located.length, total: employees.length })}
          </p>
        </div>
      </header>
      <div className="relative">
        <div
          ref={containerRef}
          className={cn(
            'w-full h-[320px] bg-surface',
            'border-t border-b border-line',
          )}
        />
        {located.length === 0 && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none text-center px-6">
            <div className="rounded-md border border-line bg-paper/95 px-4 py-3 shadow-soft pointer-events-auto max-w-xs">
              <div className="label-caps mb-1">{t('dashboard.map_empty_title')}</div>
              <p className="text-[12.5px] text-ink-soft leading-snug">
                {t('dashboard.map_empty_body')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
