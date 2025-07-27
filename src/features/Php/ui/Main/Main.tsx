import { type FC, useEffect, useRef, useState } from 'react'

import Button from '@shared/ui/Button/Button'
import { CodeEditor } from '@shared/ui/CodeEditor'
import { type ITerminalRef, Terminal } from '@shared/ui/Terminal/Terminal'

import cls from './Main.module.scss'

// URL к php-wasm (UMD/ESM)
const PHP_WEB_URL = 'https://cdn.jsdelivr.net/npm/php-wasm/PhpWeb.mjs'

// Кешируем модуль (чтобы не грузить заново при каждом запуске)
let PhpWebClass: any = null

export const Main: FC = () => {
  const [code, setCode] = useState(`
<?php
function sum($a, $b) {
    return $a + $b;
}

$result = sum(5, 7);

echo "Результат сложения: $result\\n";

?>
    `)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const terminal = useRef<ITerminalRef | null>(null)

  const executeCode = async () => {
    if (!PhpWebClass) return terminal.current?.print('PHP ещё не инициализировано')

    setIsRunning(true)
    terminal.current?.clear()

    // создаём новый PHP интерпретатор (каждый запуск — чистое состояние)
    const php = new PhpWebClass()

    // слушаем вывод
    php.addEventListener('output', (event: any) => {
      const [output] = event.detail
      terminal.current?.print(output)
    })

    php.addEventListener('error', (event: any) => {
      terminal.current?.print(`\x1b[31mОшибка: ${event.detail[0]}\x1b[0m`)
    })

    try {
      await php.run(code)
    } catch (e) {
      terminal.current?.print(`\x1b[31mСистемная ошибка: ${String(e)}\x1b[0m`)
    }
    // PHP VM автоматически умирает, когда экземпляр становится неиспользуемым
    // => отдельного terminate() здесь не требуется
    setIsRunning(false)
  }

  useEffect(() => {
    // Загружаем PhpWeb один раз при монтировании
    ;(async () => {
      setIsLoading(true)
      if (!PhpWebClass) {
        const mod = await import(/* @vite-ignore */ PHP_WEB_URL)
        PhpWebClass = mod.PhpWeb
      }
      setIsLoading(false)
    })()
  }, [])

  return (
    <div className={cls.main}>
      <CodeEditor language="php" value={code} onChange={setCode} />
      <div className={cls.btnWrapper}>
        <Button
          onClick={() => terminal.current?.clear()}
          disabled={isRunning}
          className={cls.executeBtn}
        >
          Очистить терминал
        </Button>
        <Button onClick={executeCode} disabled={isRunning || isLoading} className={cls.executeBtn}>
          {isLoading ? 'Загрузка...' : isRunning ? 'Выполняется...' : 'Выполнить'}
        </Button>
      </div>
      <Terminal ref={terminal} />
    </div>
  )
}
