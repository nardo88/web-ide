import { FC, useEffect, useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import cls from './App.module.scss'
import { classNames } from '../../helpers/classNames'
import { Checkbox } from '../CheckBox/CheckBox'
import { loadPyodide, PyodideInterface } from 'pyodide'

type LanguageTypes = 'python' | 'php' | 'typescript'

export const App: FC = () => {
  const [language, setLanguage] = useState<LanguageTypes>('python')
  const [code, setCode] = useState(`# Пример простой программы
def greet():
    name = input("Как вас зовут? ")
    print(f"Привет, {name}!")

greet()`)

  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'error'>('loading')

  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const inputBuffer = useRef<string[]>([])
  const resolveInput = useRef<((value: string) => void) | null>(null)
  const executionTimeout = useRef<NodeJS.Timeout | null>(null)

  // Инициализация терминала
  useEffect(() => {
    if (!terminalRef.current) return

    terminalInstance.current = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
    })

    fitAddon.current = new FitAddon()
    terminalInstance.current.loadAddon(fitAddon.current)
    terminalInstance.current.open(terminalRef.current)
    fitAddon.current.fit()

    terminalInstance.current.onData((data) => {
      if (data === '\r') {
        // Enter pressed
        terminalInstance.current?.writeln('')
        if (resolveInput.current && inputBuffer.current.length > 0) {
          resolveInput.current(inputBuffer.current.shift() || '')
          resolveInput.current = null
        }
      } else if (data === '\x7f') {
        // Backspace
        if (inputBuffer.current.length > 0) {
          const current = inputBuffer.current.pop() || ''
          inputBuffer.current.push(current.slice(0, -1))
          terminalInstance.current?.write('\b \b')
        }
      } else {
        // Regular input
        if (inputBuffer.current.length === 0) inputBuffer.current.push('')
        inputBuffer.current[inputBuffer.current.length - 1] += data
        terminalInstance.current?.write(data)
      }
    })

    return () => {
      terminalInstance.current?.dispose()
    }
  }, [])

  // Инициализация Pyodide
  useEffect(() => {
    const init = async () => {
      try {
        setStatus('loading')
        terminalInstance.current?.writeln('Инициализация Python...\r\n')

        const pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
          stdout: (msg) => terminalInstance.current?.write(msg),
          stderr: (msg) => terminalInstance.current?.write(`\x1b[31m${msg}\x1b[0m`),
        })

        // Настройка окружения Python
        await pyodideInstance.runPythonAsync(`
import sys
import traceback
from js import console

def execute_code(code):
    try:
        # Перенаправляем ввод/вывод
        old_stdin = sys.stdin
        old_stdout = sys.stdout
        
        class ConsoleIO:
            def write(self, text):
                console.log(text)
                return len(text)
                
            def readline(self):
                return input()
                
        sys.stdin = ConsoleIO()
        sys.stdout = ConsoleIO()
        
        # Выполняем код
        exec(code, globals())
        
    except Exception as e:
        traceback.print_exc()
    finally:
        sys.stdin = old_stdin
        sys.stdout = old_stdout
`)

        // Переопределяем input() для Python
        pyodideInstance.globals.set('input', (prompt = '') => {
          terminalInstance.current?.write(prompt)
          return new Promise((resolve) => {
            resolveInput.current = resolve
          })
        })

        setPyodide(pyodideInstance)
        setStatus('ready')
        terminalInstance.current?.writeln(
          '\x1b[32mГотово! Введите код и нажмите "Выполнить"\x1b[0m\r\n'
        )
      } catch (error) {
        setStatus('error')
        terminalInstance.current?.writeln(`\x1b[31mОшибка инициализации: ${error}\x1b[0m\r\n`)
      }
    }

    init()
  }, [])

  const execute = async () => {
    if (!pyodide || status === 'running') return

    setStatus('running')
    terminalInstance.current?.writeln('\x1b[33mВыполнение...\x1b[0m\r\n')
    inputBuffer.current = []
    resolveInput.current = null

    // Ограничение времени выполнения (5 секунд)
    executionTimeout.current = setTimeout(() => {
      terminalInstance.current?.writeln('\x1b[31mПревышено время выполнения (5 сек)\x1b[0m\r\n')
      setStatus('ready')
    }, 5000)

    try {
      await pyodide.runPythonAsync(`execute_code(${JSON.stringify(code)})`)
    } catch (error) {
      terminalInstance.current?.writeln(`\x1b[31mОшибка выполнения: ${error}\x1b[0m\r\n`)
    } finally {
      if (executionTimeout.current) {
        clearTimeout(executionTimeout.current)
        executionTimeout.current = null
      }
      setStatus('ready')
      terminalInstance.current?.writeln('\x1b[33mГотово\x1b[0m\r\n')
    }
  }

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
          <button onClick={execute} disabled={status !== 'ready'} className={cls.executeBtn}>
            {status === 'loading'
              ? 'Загрузка...'
              : status === 'running'
              ? 'Выполнение...'
              : 'Выполнить'}
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
