import React from 'react'

export default function InternetEditor({ data, onChange, onSave }: { data?: any; onChange?: (d: any) => void; onSave?: (d: any) => Promise<boolean> | boolean }) {
  const [state, setState] = React.useState({
    supplier: data?.supplier ?? '',
    username: data?.username ?? '',
    password: data?.password ?? '',
  })

  React.useEffect(() => {
    onChange?.(state)
  }, [state])

  return (
    <div className="form-inline internet-editor">
      <input placeholder="Supplier" value={state.supplier} onChange={e => setState(s => ({ ...s, supplier: e.target.value }))} />
      <input placeholder="Username" value={state.username} onChange={e => setState(s => ({ ...s, username: e.target.value }))} />
      <input placeholder="Password" type="password" value={state.password} onChange={e => setState(s => ({ ...s, password: e.target.value }))} />
      <button onClick={async () => { if (onSave) { await onSave(state) } }}>Save Internet</button>
    </div>
  )
}
