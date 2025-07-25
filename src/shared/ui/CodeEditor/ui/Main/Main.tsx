import { type FC } from 'react'

import '@fontsource/jetbrains-mono'
import { Editor } from '@monaco-editor/react'

import { classNames } from '@shared/helpers/classNames'

import type { LanguagesType } from '../../types'

import cls from './Main.module.scss'

interface ICodeEditorProps {
  className?: string
  value: string
  onChange: (v: string) => void
  language: LanguagesType
}

export const Main: FC<ICodeEditorProps> = (props) => {
  const { className, value, onChange, language } = props

  return (
    <div className={classNames(cls.codeEditor, {}, [className])}>
      <Editor
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          fontFamily: 'JetBrains Mono',
          fontSize: 14,
          lineHeight: 24,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderWhitespace: 'none',
          automaticLayout: true,
        }}
      />
    </div>
  )
}
