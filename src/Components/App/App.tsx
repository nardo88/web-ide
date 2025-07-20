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
  const [code, setCode] = useState(`# Найдем минимальное из трех чисел
a = int(input("Введите первое число: "))
b = int(input("Введите второе число: "))
c = int(input("Введите третье число: "))

min_val = a
if b < min_val:
    min_val = b
if c < min_val:
    min_val = c

print("Наименьшее число:", min_val)`)
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)
  const [isPyodideLoading, setIsPyodideLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const inputQueue = useRef<string[]>([])
  const resolveInputPromise = useRef<((value: string) => void) | null>(null)

  // Инициализация терминала
  useEffect(() => {
    if (!terminalRef.current) return

    // Terminal - инструмент ввода/вывода, нажатие Enter мы обрабатываем сами
    terminalInstance.current = new Terminal({
      cursorBlink: true, // мигание курсора
      fontFamily: 'JetBrains Mono, monospace', // Семейство шрифта
      fontSize: 14, // размер шрифта
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    })
    // FitAddon - подгоняет размеры терминала под размеры контейнера (div элемента)
    fitAddon.current = new FitAddon()
    terminalInstance.current.loadAddon(fitAddon.current)
    terminalInstance.current.open(terminalRef.current)
    fitAddon.current.fit()

    // Обработчик ввода данных
    const handleTerminalData = (data: string) => {
      // пользователь нажал Enter
      if (data === '\r') {
        console.log('input: ', inputQueue.current)
        // в resolveInputPromise хранится метод, который эмулирует input в питоне
        if (resolveInputPromise.current) {
          // В inputQueue.current хранится массив из одного элемента - то что ввел пользователь
          const input = inputQueue.current.shift()
          if (input !== undefined) {
            // метод writeln добавляет в терминал строку
            terminalInstance.current?.writeln('')
            // В метод resolveInputPromise.current передаем введенный текст
            resolveInputPromise.current(input)
            resolveInputPromise.current = null
          }
        }
        // пользователь вводит Backspace
      } else if (data === '\x7f') {
        // Backspace
        if (
          inputQueue.current.length > 0 &&
          inputQueue.current[inputQueue.current.length - 1].length > 0
        ) {
          const currentInput = inputQueue.current[inputQueue.current.length - 1]
          inputQueue.current[inputQueue.current.length - 1] = currentInput.slice(0, -1)
          terminalInstance.current?.write('\b \b')
        }
      } else {
        // Regular input
        if (inputQueue.current.length === 0) {
          inputQueue.current.push('')
        }
        inputQueue.current[inputQueue.current.length - 1] += data
        terminalInstance.current?.write(data)
      }
    }

    terminalInstance.current.onData(handleTerminalData)

    return () => {
      terminalInstance.current?.dispose()
    }
  }, [])

  // Инициализация Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        const pyodideInstance = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
          stdout: (msg) => terminalInstance.current?.write(msg),
          stderr: (msg) => terminalInstance.current?.write('\x1b[31m' + msg + '\x1b[0m'),
        })

        // Переопределяем стандартный input
        pyodideInstance.globals.set('input', (prompt = '') => {
          terminalInstance.current?.write(prompt)
          return new Promise<string>((resolve) => {
            resolveInputPromise.current = resolve
          })
        })

        setPyodide(pyodideInstance)

        // Определяем функцию-обертку для запуска кода с обработкой ошибок
        await pyodideInstance.runPythonAsync(`
import sys
import traceback

def run_user_code():
    try:
        exec(user_code, globals())
    except ValueError:
        print("\\x1b[31mОшибка ввода: убедитесь, что введены числа\\x1b[0m")
    except Exception:
        print("\\x1b[31mОшибка выполнения:\\x1b[0m")
        traceback.print_exc()
`)
        terminalInstance.current?.writeln('\x1b[32mPython готов к работе!\x1b[0m')
      } catch (error) {
        terminalInstance.current?.writeln('\x1b[31mОшибка загрузки Python:\x1b[0m')
        terminalInstance.current?.writeln(`\x1b[31m${error}\x1b[0m`)
      } finally {
        setIsPyodideLoading(false)
      }
    }

    initPyodide()
  }, [])

  const executeCode = async () => {
    if (!pyodide || !terminalInstance.current) return

    setIsRunning(true)
    terminalInstance.current.clear()
    inputQueue.current = []
    resolveInputPromise.current = null

    try {
      // Передаем код пользователя в глобальную переменную user_code
      pyodide.globals.set('user_code', code)

      // Вызываем функцию запуска кода с обработкой ошибок
      await pyodide.runPythonAsync('run_user_code()')
    } catch (error) {
      terminalInstance.current.writeln(`\x1b[31mСистемная ошибка: ${error}\x1b[0m`)
    } finally {
      setIsRunning(false)
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
            onChange={(value) => value && setCode(value)}
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
            {isPyodideLoading ? 'Загрузка Python...' : isRunning ? 'Выполняется...' : 'Выполнить'}
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
