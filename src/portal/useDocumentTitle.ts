import { useEffect } from 'react'
import { SITE } from '../config'

/** タブのタイトル。page が無ければ SITE.title、あれば "page - SITE.title" */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} - ${SITE.title}` : SITE.title
  }, [page])
}
