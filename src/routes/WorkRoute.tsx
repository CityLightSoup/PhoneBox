import { Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { useDocumentTitle } from '../portal/useDocumentTitle'
import { findWorkBySlug, workComponents } from '../works/registry'
import { BootScreen } from './BootScreen'

/** /works/:slug 。作品は lazy で読み込み、常に「Hang up」で電話ボックスへ戻れる */
export default function WorkRoute() {
  const { slug = '' } = useParams()
  const work = findWorkBySlug(slug)
  const Work = work ? workComponents.get(work.slug) : undefined
  useDocumentTitle(work ? work.title : 'NOT IN SERVICE')

  return (
    <div className="work-root">
      <Link to="/" className="text-btn work-hangup">
        Hang up
      </Link>
      <Suspense fallback={<BootScreen text="Connecting" />}>
        {Work ? (
          <Work />
        ) : (
          <div className="work-fill work-center">
            <p className="notice">NOT IN SERVICE</p>
          </div>
        )}
      </Suspense>
    </div>
  )
}
