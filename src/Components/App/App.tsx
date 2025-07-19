import { FC, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import cls from './App.module.scss'
import { classNames } from '../../helpers/classNames'
import { Checkbox } from '../CheckBox/CheckBox'

import { loadPyodide, PyodideInterface } from 'pyodide'

type LanguageTypes = 'python' | 'php' | 'typescript'

export const App: FC = () => {
  const [language, setLanguage] = useState<LanguageTypes>('python')
  const [code, setCode] = useState("const a = ''")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')
  const [isPyodideLoading, setIsPyodideLoading] = useState(false)
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null)
  console.log('pyodide: ', pyodide)

  const execute = async () => {
    if (!code || !pyodide || language !== 'python') return

    setIsLoading(true)
    setResult('')

    try {
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()

${code}

result = sys.stdout.getvalue()
result
      `)

      const output = pyodide.globals.get('result')
      setResult(output || 'Код выполнен (но вывод пуст)')
    } catch (error: any) {
      setResult(`Ошибка: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsPyodideLoading(true)
    loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
    })
      .then((py) => {
        setPyodide(py)
        setIsPyodideLoading(false)
      })
      .catch((e) => {
        console.log('error', e)
      })
  }, [])

  return (
    <div className={classNames(cls.app, {}, ['container'])}>
      <div className={cls.code}>
        <div className={classNames(cls.ide, {}, [cls.block])}>
          <Editor
            defaultLanguage={language}
            key={language}
            value={code}
            onChange={(v) => v && setCode(v)}
            height="400px"
            theme="vs-dark"
            onMount={(editor) => {
              editor.updateOptions({
                fontFamily: 'JetBrains Mono, monospace',
                fontLigatures: false,
                fontSize: 16,
                lineHeight: 24,
              })
            }}
            options={{ renderWhitespace: 'none' }}
          />
          <button disabled={isLoading} onClick={execute} className={cls.executeBtn}>
            execute
          </button>
        </div>

        <div className={classNames(cls.result, {}, [cls.block])}>
          <div className={cls.resultWrapper}>
            {isLoading && <p style={{ color: 'white' }}>Загрузка...</p>}
            <code className={classNames(cls.resultValue)}>{result}</code>
          </div>
        </div>
      </div>
      <div className={classNames(cls.languages, {}, [cls.block])}>
        <ul>
          <li>
            <Checkbox
              checked={language === 'python'}
              onChangeHandler={() => setLanguage('python')}
              label="python"
            />
          </li>
          <li>
            <Checkbox
              checked={language === 'php'}
              onChangeHandler={() => setLanguage('php')}
              label="php"
            />
          </li>
          <li>
            <Checkbox
              checked={language === 'typescript'}
              onChangeHandler={() => setLanguage('typescript')}
              label="TypeScript"
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
