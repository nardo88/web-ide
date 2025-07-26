export {}

declare const self: DedicatedWorkerGlobalScope

// Переопределяем только методы log и error, не трогая весь объект console
console.log = (...args: any[]) => {
  self.postMessage({ type: 'stdout', data: args.join(' ') })
}

console.error = (...args: any[]) => {
  self.postMessage({ type: 'stderr', data: args.join(' ') })
}

self.onmessage = (event: MessageEvent<{ code: string }>) => {
  const { code } = event.data
  try {
    // Выполняем переданный JS код
    const result = new Function(code)()
    self.postMessage({ type: 'stdout', data: String(result ?? '') })
  } catch (e: any) {
    self.postMessage({ type: 'stderr', data: e.message })
  } finally {
    self.postMessage({ type: 'done' })
  }
}
