import { type FC, useEffect, useRef, useState } from 'react'

import * as ts from 'typescript'

import Button from '@shared/ui/Button/Button'
import { CodeEditor } from '@shared/ui/CodeEditor'
import { type ITerminalRef, Terminal } from '@shared/ui/Terminal/Terminal'

import cls from './Main.module.scss'

const compileTS = (code: string) => {
  const result = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 },
  })
  return result.outputText
}

export const Main: FC = () => {
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const terminal = useRef<ITerminalRef | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const executeCode = () => {
    if (!workerRef.current) return
    setIsRunning(true)
    terminal.current?.clear()
    workerRef.current.postMessage({ code: compileTS(code) })
  }

  useEffect(() => {
    const worker = new Worker(
      new URL('../../../../shared/workers/javaScriptWorker.ts', import.meta.url),
      {
        type: 'module',
      }
    )
    worker.onmessage = (e) => {
      const { type, data } = e.data
      if (type === 'stdout') terminal.current?.print(data)
      if (type === 'stderr') terminal.current?.print(`\x1b[31m${data}\x1b[0m\r`)
      setIsRunning(false)
    }
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  return (
    <div className={cls.main}>
      <CodeEditor language="typescript" value={code} onChange={setCode} />
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
