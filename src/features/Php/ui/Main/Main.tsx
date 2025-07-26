import { type FC, useEffect, useRef, useState } from 'react'

import Button from '@shared/ui/Button/Button'
import { CodeEditor } from '@shared/ui/CodeEditor'
import { type ITerminalRef, Terminal } from '@shared/ui/Terminal/Terminal'

import cls from './Main.module.scss'

export const Main: FC = () => {
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const terminal = useRef<ITerminalRef | null>(null)

  const executeCode = () => {
    // setIsRunning(true)
    terminal.current?.clear()
    workerRef.current?.postMessage({ code })
  }

  useEffect(() => {
    const worker = new Worker(new URL('../../../../shared/workers/phpWorker.ts', import.meta.url), {
      type: 'module',
    })
    console.log('worker: ', worker)

    worker.onmessage = (e) => {
      const { type, data } = e.data
      if (type === 'stdout') terminal.current?.print(data)
      if (type === 'stderr') terminal.current?.print(`\x1b[31m${data}\x1b[0m`)
      setIsRunning(false)
    }

    worker.onerror = (e) => {
      console.error('Ошибка воркера:', JSON.stringify(e))
    }
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  return (
    <div className={cls.main}>
      <CodeEditor language="php" value={code} onChange={setCode} />
      <div className={cls.btnWrapper}>
        <Button
          onClick={() => terminal.current?.clear()}
          disabled={isRunning}
          className={cls.executeBtn}
        >
          Очистить терминал
        </Button>
        <Button onClick={executeCode} disabled={isRunning} className={cls.executeBtn}>
          {isRunning ? 'Выполняется...' : 'Выполнить'}
        </Button>
      </div>
      <Terminal ref={terminal} />
    </div>
  )
}
