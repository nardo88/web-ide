import { type FC, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { classNames } from '@shared/helpers/classNames'
import Button from '@shared/ui/Button/Button'
import ArrowBottom from '@shared/ui/icons/ArrowBottom'

import cls from './Sidebar.module.scss'

const links = [
  { path: 'python', title: 'Python' },
  { path: 'javascript', title: 'JavaScript' },
]

export const Sidebar: FC = () => {
  const { language } = useParams()

  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className={classNames(cls.sidebar, { [cls.isOpen]: isOpen })}>
      <div className={cls.top}>
        <Button className={cls.toggleBtn} onClick={() => setIsOpen((p) => !p)} variant="tertiary">
          <ArrowBottom className={classNames(cls.icon, { [cls.openIcon]: isOpen })} />
        </Button>
      </div>
      <ul className={classNames(cls.linkWrapper, { [cls.isVisible]: isOpen })}>
        {links.map((item) => (
          <li
            key={item.path}
            className={classNames(cls.linkItem, { [cls.active]: language === item.path })}
          >
            <Link to={`/${item.path}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
