import { type FC, useEffect, useRef } from 'react'

import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

import { classNames } from '@shared/helpers/classNames'

import cls from './Terminal.module.scss'

interface ITerminalProps {
  className?: string
  value: string
  onInput?: (data: string) => void
}

export const Terminal: FC<ITerminalProps> = (props) => {
  const { className, value } = props

  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<XTerm | null>(null)
  const resolveInputPromise = useRef<((value: string) => void) | null>(null)
  const inputQueue = useRef<string[]>([])
  const fitAddon = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current || terminalInstance.current) return

    const terminal = new XTerm({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
      allowTransparency: true,
      disableStdin: false,
    })

    // FitAddon подгоняет размеры под размеры родителя
    const addon = new FitAddon()
    terminal.loadAddon(addon)
    terminal.open(terminalRef.current)
    addon.fit()
    // onData срабатывает только на ввод с клавиатуры
    terminal.onData((data) => {
      // Enter
      if (data === '\r') {
        if (resolveInputPromise.current && inputQueue.current.length > 0) {
          terminal.writeln('')
          resolveInputPromise.current(inputQueue.current.shift()!)
          resolveInputPromise.current = null
        }
      } else if (data === '\x7f') {
        if (inputQueue.current.length > 0) {
          const input = inputQueue.current[0]
          if (input.length > 0) {
            inputQueue.current[0] = input.slice(0, -1)
            terminal.write('\b \b')
          }
        }
      } else {
        if (inputQueue.current.length === 0) inputQueue.current.push('')
        inputQueue.current[0] += data
        terminal.write(data)
      }
    })

    terminalInstance.current = terminal
    fitAddon.current = addon
    terminal.write('\x1b[32mГотов к работе...\x1b[0m\r\n')

    return () => {
      terminalInstance.current?.dispose()
      terminalInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (terminalInstance.current) {
      terminalInstance.current.clear()
      terminalInstance.current.write(value)
    }
  }, [value])
  return (
    <div className={classNames(cls.terminal, {}, [className])}>
      <div ref={terminalRef} className={cls.terminal} style={{ height: '200px' }} />
    </div>
  )
}
