import { getPHPLoaderModule } from '@php-wasm/web'

// ===========================

// PHP.load() calls import('php.wasm') internally
// Your bundler must resolve import('php.wasm') as a static file URL.
// If you use Webpack, you can use the file-loader to do so.
// const php = await PHP.load('8.0', {
// 	requestHandler: {
// 		documentRoot: '/www',
// 	},
// });

// Create and run a script directly
// php.mkdirTree('/www');
// php.writeFile('/www/index.php', `<?php echo "Hello " . $_POST['name']; ?>`);
// await php.run({ scriptPath: './index.php' });

// Or use the familiar HTTP concepts:
// const response = await php.request({
// 	method: 'POST',
// 	url: '/index.php',
// 	data: { name: 'John' },
// });
// console.log(response.text);
// ===========================
export {}

// let php: any = null

self.onmessage = async (e) => {
  console.log({ getPHPLoaderModule })
  try {
    // Лог, что получили сообщение с кодом
    console.log('Worker получил код для выполнения:', e.data.code)

    // Если PHP runtime ещё не загружен, загружаем его
    // if (!php) {
    //   console.log('Загружаем PHP runtime...')
    //   // php = await loadWebRuntime('8.2')
    //   console.log('PHP runtime загружен')
    //   self.postMessage({ type: 'stdout', data: 'PHP runtime загружен' })
    // }

    // // Записываем файл с кодом
    // php.FS.writeFile('/index.php', e.data.code)
    // console.log('Файл /index.php записан')

    // // Выполняем скрипт
    // const result = php.ccall('php_execute_script', 'string', ['string'], ['/index.php'])
    // console.log('Выполнение завершено, результат:', result)

    // Отправляем результат обратно в главный поток
    self.postMessage({ type: 'stdout', data: e.data.code })
  } catch (err: any) {
    // Логируем ошибку и отправляем в главный поток
    console.error('Ошибка в воркере:', err)
    self.postMessage({ type: 'stderr', data: err.message || String(err) })
  }

  self.postMessage({ type: 'stdout', data: e.data.code })
}
