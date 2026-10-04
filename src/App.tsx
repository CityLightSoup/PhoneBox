import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { BootScreen } from './routes/BootScreen'
import WorkRoute from './routes/WorkRoute'

// ポータルはglbやR3Fを含むので、作品ページを直接開いたときは読み込まない
const PortalRoute = lazy(() => import('./routes/PortalRoute'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<BootScreen />}>
        <Routes>
          <Route path="/" element={<PortalRoute />} />
          <Route path="/works/:slug" element={<WorkRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
