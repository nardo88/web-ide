self.console = {
  log: (...args) => self.postMessage({ type: 'stdout', data: args.join(' ') }),
  error: (...args) => self.postMessage({ type: 'stderr', data: args.join(' ') }),
}

self.onmessage = function (event) {
  const { code } = event.data
  try {
    const result = new Function(code)()
    self.postMessage({ type: 'stdout', data: String(result ?? '') })
  } catch (e) {
    self.postMessage({ type: 'stderr', data: e.message })
  } finally {
    self.postMessage({ type: 'done' })
  }
}
