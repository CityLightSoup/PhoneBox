export function BootScreen({ text = 'Loading' }: { text?: string }) {
  return (
    <div className="boot">
      <p>{text}...</p>
    </div>
  )
}
