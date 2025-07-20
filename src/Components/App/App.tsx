import { FC, useEffect, useState, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import cls from './App.module.scss'
import { classNames } from '../../helpers/classNames'
import { Checkbox } from '../CheckBox/CheckBox'
import { loadPyodide, PyodideInterface } from 'pyodide'

type LanguageTypes = 'python' | 'php' | 'typescript'

// Кешируем загруженные пакеты Pyodide
const loadedPackages = new Set<string>()

export const App: FC = () => {
  const [language, setLanguage] = useState<LanguageTypes>('python')
  const [code, setCode] = useState('')
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)
  const [isPyodideLoading, setIsPyodideLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const inputQueue = useRef<string[]>([])
  const resolveInputPromise = useRef<((value: string) => void) | null>(null)
  const pyodideInstance = useRef<PyodideInterface | null>(null)

  // Оптимизированная функция сброса терминала
  const resetTerminal = useCallback(() => {
    if (terminalInstance.current) {
      terminalInstance.current.reset()
      terminalInstance.current.clear()
      terminalInstance.current.write('\x1b[32m> \x1b[0m')
    }
    inputQueue.current = []
    resolveInputPromise.current = null
  }, [])

  // Инициализация терминала с оптимизацией
  const initTerminal = useCallback(() => {
    if (!terminalRef.current || terminalInstance.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
      allowTransparency: true,
    })

    const addon = new FitAddon()
    terminal.loadAddon(addon)
    terminal.open(terminalRef.current)
    addon.fit()

    terminal.onData((data) => {
      if (data === '\r') {
        if (resolveInputPromise.current && inputQueue.current.length > 0) {
          terminal.writeln('')
          resolveInputPromise.current(inputQueue.current.shift()!)
          resolveInputPromise.current = null
        }
      } else if (data === '\x7f') {
        if (inputQueue.current.length > 0) {
          const input = inputQueue.current[0]
          if (input.length > 0) {
            inputQueue.current[0] = input.slice(0, -1)
            terminal.write('\b \b')
          }
        }
      } else {
        if (inputQueue.current.length === 0) inputQueue.current.push('')
        inputQueue.current[0] += data
        terminal.write(data)
      }
    })

    terminalInstance.current = terminal
    fitAddon.current = addon
    terminal.write('\x1b[32mИнициализация...\x1b[0m\r\n')
  }, [])

  // Загрузка необходимых пакетов Pyodide
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
      setIsPyodideLoading(true)
      resetTerminal()

      const instance = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
        stdout: (msg) => terminalInstance.current?.write(msg),
        stderr: (msg) => terminalInstance.current?.write(`\x1b[31m${msg}\x1b[0m`),
      })

      await loadRequiredPackages(instance)

      instance.globals.set('input', (prompt = '') => {
        terminalInstance.current?.write(prompt)
        return new Promise<string>((resolve) => {
          resolveInputPromise.current = resolve
        })
      })

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

      resetTerminal()
      terminalInstance.current?.writeln('\x1b[32mPython готов к работе!\x1b[0m\r\n')
      pyodideInstance.current = instance
      return instance
    } catch (error) {
      terminalInstance.current?.writeln(`\x1b[31mОшибка инициализации: ${error}\x1b[0m\r\n`)
      throw error
    } finally {
      setIsPyodideLoading(false)
    }
  }, [loadRequiredPackages, resetTerminal])

  // Основной эффект инициализации
  useEffect(() => {
    initTerminal()
    const controller = new AbortController()

    ;(async () => {
      try {
        const instance = await initPyodide()
        setPyodide(instance)
      } catch (error) {
        console.error('Pyodide initialization failed:', error)
      }
    })()

    return () => {
      controller.abort()
      // Очистка при размонтировании
      terminalInstance.current?.dispose()
      terminalInstance.current = null
      pyodideInstance.current = null
    }
  }, [initTerminal, initPyodide])

  // Оптимизированная функция выполнения кода
  const executeCode = useCallback(async () => {
    if (!pyodideInstance.current || !terminalInstance.current || isRunning) return

    setIsRunning(true)
    resetTerminal()

    try {
      pyodideInstance.current.globals.set('user_code', code)
      await pyodideInstance.current.runPythonAsync('run_user_code()')
    } catch (error) {
      terminalInstance.current.writeln(`\x1b[31mСистемная ошибка: ${error}\x1b[0m\r\n`)
    } finally {
      setIsRunning(false)
    }
  }, [code, isRunning, resetTerminal])

  return (
    <div className={classNames(cls.app, {}, ['container'])}>
      <div className={cls.code}>
        <div className={classNames(cls.ide, {}, [cls.block])}>
          <Editor
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            height="400px"
            theme="vs-dark"
            options={{
              fontFamily: 'JetBrains Mono',
              fontSize: 14,
              lineHeight: 24,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderWhitespace: 'none',
            }}
          />
          <button
            onClick={executeCode}
            disabled={isPyodideLoading || isRunning}
            className={cls.executeBtn}>
            {isPyodideLoading ? 'Загрузка...' : isRunning ? 'Выполняется...' : 'Выполнить'}
          </button>
        </div>

        <div className={classNames(cls.result, {}, [cls.block])}>
          <div ref={terminalRef} className={cls.terminal} style={{ height: '200px' }} />
        </div>
      </div>

      <div className={classNames(cls.languages, {}, [cls.block])}>
        <ul>
          <li>
            <Checkbox
              checked={language === 'python'}
              onChangeHandler={() => setLanguage('python')}
              label="Python"
            />
          </li>
          <li>
            <Checkbox
              checked={language === 'php'}
              onChangeHandler={() => setLanguage('php')}
              label="PHP"
              disabled
            />
          </li>
          <li>
            <Checkbox
              checked={language === 'typescript'}
              onChangeHandler={() => setLanguage('typescript')}
              label="TypeScript"
              disabled
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
