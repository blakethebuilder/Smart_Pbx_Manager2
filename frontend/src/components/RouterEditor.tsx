import React from 'react'

export default function RouterEditor({ data, onChange, onSave }: { data?: any; onChange?: (d: any) => void; onSave?: (d: any) => Promise<boolean> | boolean }) {
  const [state, setState] = React.useState({ model: data?.model ?? '', ip: data?.ip ?? '', username: data?.username ?? '', password: data?.password ?? '' })

  React.useEffect(() => {
    onChange?.(state)
  }, [state])

  return (
    <div className="form-inline router-editor">
      <input placeholder="Model" value={state.model} onChange={e => setState(s => ({ ...s, model: e.target.value }))} />
      <input placeholder="IP" value={state.ip} onChange={e => setState(s => ({ ...s, ip: e.target.value }))} />
      <input placeholder="Username" value={state.username} onChange={e => setState(s => ({ ...s, username: e.target.value }))} />
      <input placeholder="Password" type="password" value={state.password} onChange={e => setState(s => ({ ...s, password: e.target.value }))} />
      <button onClick={async () => { if (onSave) { await onSave(state) } }}>Save Router</button>
    </div>
  )
}
