import { type FC, useCallback, useEffect, useRef, useState } from 'react'

import { type PyodideInterface, loadPyodide } from 'pyodide'

import Button from '@shared/ui/Button/Button'
import { CodeEditor } from '@shared/ui/CodeEditor'
import { type ITerminalRef, Terminal } from '@shared/ui/Terminal/Terminal'

import cls from './Main.module.scss'

const loadedPackages = new Set<string>()

export const Main: FC = () => {
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const pyodideInstance = useRef<PyodideInterface | null>(null)
  const terminal = useRef<ITerminalRef | null>(null)

  const executeCode = async () => {
    if (!code.trim()) {
      return terminal.current?.print(`\x1b[31mNo code\x1b[0m`)
    }
    if (!pyodideInstance.current || isRunning) return

    setIsRunning(true)
    terminal.current?.clear()

    try {
      pyodideInstance.current.globals.set('user_code', code)
      await pyodideInstance.current.runPythonAsync('run_user_code()')
    } catch (error) {
      terminal.current?.print(`\x1b[31mСистемная ошибка: ${error}\x1b[0m\r\n`)
    } finally {
      setIsRunning(false)
    }
  }

  const loadRequiredPackages = useCallback(async (pyodide: PyodideInterface) => {
    const requiredPackages = ['numpy', 'pandas']
    const packagesToLoad = requiredPackages.filter((pkg) => !loadedPackages.has(pkg))

    if (packagesToLoad.length > 0) {
      await pyodide.loadPackage(packagesToLoad)
      packagesToLoad.forEach((pkg) => loadedPackages.add(pkg))
    }
  }, [])

  // Инициализация Pyodide с кешированием
  const initPyodide = useCallback(async () => {
    if (pyodideInstance.current) return pyodideInstance.current

    try {
      setIsLoading(true)
      terminal.current?.clear()

      const instance = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
        stdout: (msg) => terminal.current?.print(msg + '\x1b[0m\r'),
        stderr: (msg) => terminal.current?.print(`\x1b[31m${msg}\x1b[0m\r`),
      })

      await loadRequiredPackages(instance)

      await instance.runPythonAsync(`
import sys
import traceback
from js import console

def run_user_code():
    try:
        exec(user_code, globals())
    except ValueError:
        print("\\x1b[31mОшибка ввода: убедитесь, что введены числа\\x1b[0m")
    except Exception:
        print("\\x1b[31mОшибка выполнения:\\x1b[0m")
        traceback.print_exc()
`)

      terminal.current?.clear()
      terminal.current?.print('\x1b[32mPython готов к работе!\x1b[0m\r\n')
      pyodideInstance.current = instance
    } catch (error) {
      terminal.current?.print(`\x1b[31mОшибка инициализации: ${error}\x1b[0m\r\n`)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [loadRequiredPackages])

  useEffect(() => {
    const controller = new AbortController()

    ;(async () => {
      try {
        initPyodide()
      } catch (error) {
        console.error('Pyodide initialization failed:', error)
      }
    })()

    return () => {
      controller.abort()
      pyodideInstance.current = null
    }
  }, [])

  return (
    <div className={cls.main}>
      <CodeEditor language="python" value={code} onChange={setCode} />
      <div className={cls.btnWrapper}>
        <Button
          onClick={() => terminal.current?.clear()}
          disabled={isLoading || isRunning}
          className={cls.executeBtn}
        >
          Очистить терминал
        </Button>
        <Button onClick={executeCode} disabled={isLoading || isRunning} className={cls.executeBtn}>
          {isLoading ? 'Загрузка...' : isRunning ? 'Выполняется...' : 'Выполнить'}
        </Button>
      </div>
      <Terminal ref={terminal} />
    </div>
  )
}
