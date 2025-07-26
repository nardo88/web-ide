import type { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import Button from '@shared/ui/Button/Button'

import { Sidebar } from '../Sidebar/Sidebar'

import cls from './Main.module.scss'

interface LayoutProps {
  children: ReactNode
}

export const Main: FC<LayoutProps> = ({ children }) => {
  const signinHandler = () => null
  const signupHandler = () => null

  return (
    <div className={cls.Layout}>
      <header className={cls.header}>
        <div className="container">
          <div className={cls.wrapper}>
            <div>
              <Link to="/">
                <img src="/img/logo.svg" alt="" />
              </Link>
            </div>
            <div className={cls.btnWrapper}>
              <Button onClick={signinHandler} variant="secondary">
                Signin
              </Button>
              <Button onClick={signupHandler} variant="primary">
                Signup
              </Button>
            </div>
          </div>
        </div>
      </header>
      <Sidebar />
      <div className={cls.container}>{children}</div>
    </div>
  )
}
