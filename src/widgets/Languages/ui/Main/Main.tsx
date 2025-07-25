import { type FC } from 'react'
import { useParams } from 'react-router-dom'

import { Python } from '@features/Python'

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
          default:
            return <NotFoundPage />
        }
      })(language)}
    </div>
  )
}
