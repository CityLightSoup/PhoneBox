import { Component, type ReactNode } from 'react'

/** glbが見つからないときなどに、真っ黒な画面ではなく原因を出す */
export class PortalErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="fatal">
        <p>Failed to load the scene.</p>
        <p className="fatal-detail">{this.state.error.message}</p>
        <p>Check that public/models/phone.glb exists (see README).</p>
      </div>
    )
  }
}
