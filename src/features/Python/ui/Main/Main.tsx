import { type FC, useState } from 'react'

import { CodeEditor } from '@shared/ui/CodeEditor'

import cls from './Main.module.scss'

export const Main: FC = () => {
  const [code, setCode] = useState('')
  return (
    <div className={cls.main}>
      <CodeEditor language="python" value={code} onChange={setCode} />
    </div>
  )
}
