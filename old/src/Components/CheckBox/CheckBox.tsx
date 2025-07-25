import { ChangeEvent, FC, ReactNode, useEffect, useState } from 'react'

import cls from './CheckBox.module.scss'
import { classNames } from '../../helpers/classNames'

type IProps = {
  checked: boolean
  label?: string | ReactNode
  sublabel?: string
  name?: string | null
  disabled?: boolean
  className?: string
  onChangeHandler?: (e: CheckboxChangeType) => void
  haveError?: boolean
  errorText?: string
  iconColor?: string
}

export type CheckboxChangeType = { name: string | null; checked: boolean }

export const Checkbox: FC<IProps> = ({
  checked,
  label,
  name = null,
  disabled = false,
  onChangeHandler,
  className,
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(checked)

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (disabled || !onChangeHandler) return
    onChangeHandler({ name, checked: event.target.checked })
  }

  useEffect(() => setIsChecked(checked), [checked])

  return (
    <div className={classNames(cls.wrapper, {}, [className])}>
      <label>
        <input type="checkbox" checked={isChecked} disabled={disabled} onChange={onChange} />
        <span className={classNames(cls.label, { cup: !disabled })}>
          {isChecked && <span className={cls.isChecked} />}
        </span>

        {label && <span className={classNames(cls.span, { cup: !disabled })}>{label}</span>}
      </label>
    </div>
  )
}
