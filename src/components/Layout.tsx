import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'

interface Props {
  children: ReactNode
  title?: ReactNode
  eyebrow?: ReactNode
}

export function Layout({ children, title, eyebrow }: Props) {
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
        <Topbar title={title} eyebrow={eyebrow} />
        <main className="flex-1 px-5 lg:px-8 py-6 lg:py-8 nice-scroll">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
