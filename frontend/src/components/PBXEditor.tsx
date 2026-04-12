import React from 'react'

export default function PBXEditor({ data, onChange, onSave }: { data?: any; onChange?: (state: any) => void; onSave?: (state: any) => Promise<boolean> | boolean }) {
  const [state, setState] = React.useState({
    host: data?.host ?? '',
    port: data?.port ?? 8547,
    username: data?.username ?? '',
    password: data?.password ?? '',
  })

  // propagate changes upward if callback provided
  React.useEffect(() => {
    onChange?.(state)
  }, [state])

  return (
    <div className="form-inline pbx-editor">
      <input placeholder="Host" value={state.host} onChange={e => setState(s => ({ ...s, host: e.target.value }))} />
      <input placeholder="Port" type="number" value={state.port} onChange={e => setState(s => ({ ...s, port: Number(e.target.value) }))} />
      <input placeholder="Username" value={state.username} onChange={e => setState(s => ({ ...s, username: e.target.value }))} />
      <input placeholder="Password" type="password" value={state.password} onChange={e => setState(s => ({ ...s, password: e.target.value }))} />
      <button onClick={async () => {
        const ok = await (onSave ? onSave(state) : true)
        // No UI here; parent handles toasts/messages
        return ok
      }}>Save PBX</button>
    </div>
  )
}
