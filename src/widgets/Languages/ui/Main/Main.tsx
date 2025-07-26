import { type FC } from 'react'
import { useParams } from 'react-router-dom'

import { JavaScript } from '@features/JavaScript'
import { Php } from '@features/Php'
import { Python } from '@features/Python'
import { TypeScript } from '@features/TypeScript'

import { NotFoundPage } from '@shared/ui/NotFoundPage/NotFoundPage'

import cls from './Main.module.scss'

export const Main: FC = () => {
  const { language } = useParams()

  return (
    <div className={cls.main}>
      {((language) => {
        switch (language) {
          case 'python':
            return <Python />
          case 'javascript':
            return <JavaScript />
          case 'typescript':
            return <TypeScript />
          case 'php':
            return <Php />
          default:
            return <NotFoundPage />
        }
      })(language)}
    </div>
  )
}
