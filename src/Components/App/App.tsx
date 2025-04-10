import { FC, useState } from 'react'
import Editor from '@monaco-editor/react'
import cls from './App.module.scss'
import { classNames } from '../../helpers/classNames'
import { Checkbox } from '../CheckBox/CheckBox'
import axios from 'axios'

type LanguageTypes = 'python' | 'php' | 'typescript'

export const App: FC = () => {
  const [language, setLanguage] = useState<LanguageTypes>('python')
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState('')

  const execute = () => {
    if (!code) return
    setIsLoading(true)
    setResult('')
    axios
      .post('http://localhost:5000/execute', {
        language,
        code,
      })
      .then(({ data }) => {
        console.log('data: ', data)
        setResult(data.output)
      })
      .catch((e) => {
        console.error(e.response)
      })
      .finally(() => setIsLoading(false))
  }
  return (
    <div className={classNames(cls.app, {}, ['container'])}>
      <div className={cls.code}>
        <div className={classNames(cls.ide, {}, [cls.block])}>
          <Editor
            defaultLanguage={language}
            onChange={(v) => {
              if (v) setCode(v)
            }}
            value={code}
            height="400px"
            theme="vs-dark"
          />
          <button disabled={isLoading} onClick={execute} className={cls.executeBtn}>
            execute
          </button>
        </div>

        <div className={classNames(cls.result, {}, [cls.block])}>
          <code className={classNames(cls.resultValue)}>{result}</code>
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
              label="typescript"
            />
          </li>
        </ul>
      </div>
    </div>
  )
}
