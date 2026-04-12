import React from 'react'

export default function WifiEditor({ data, onChange, onSave }: { data?: any; onChange?: (d: any) => void; onSave?: (d: any) => Promise<boolean> | boolean }) {
  const [state, setState] = React.useState({ ssid: data?.ssid ?? '', password: data?.password ?? '' })

  React.useEffect(() => {
    onChange?.(state)
  }, [state])

  return (
    <div className="form-inline wifi-editor">
      <input placeholder="SSID" value={state.ssid} onChange={e => setState(s => ({ ...s, ssid: e.target.value }))} />
      <input placeholder="Password" type="password" value={state.password} onChange={e => setState(s => ({ ...s, password: e.target.value }))} />
      <button onClick={async () => { if (onSave) { await onSave(state) } }}>Save Wifi</button>
    </div>
  )
}
