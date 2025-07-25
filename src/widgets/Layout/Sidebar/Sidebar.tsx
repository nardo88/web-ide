import { type FC, useState } from 'react'

import { classNames } from '@shared/helpers/classNames'
import Button from '@shared/ui/Button/Button'
import ArrowBottom from '@shared/ui/icons/ArrowBottom'

import cls from './Sidebar.module.scss'

export const Sidebar: FC = () => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className={classNames(cls.sidebar, { [cls.isOpen]: isOpen })}>
      <div className={cls.top}>
        <Button className={cls.toggleBtn} onClick={() => setIsOpen((p) => !p)} variant="tertiary">
          <ArrowBottom className={classNames(cls.icon, { [cls.openIcon]: isOpen })} />
        </Button>
      </div>
    </div>
  )
}
