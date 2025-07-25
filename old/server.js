import express from 'express'
import cors from 'cors'
import Docker from 'dockerode'

const app = express()

const getImageAndCmd = (language, code) => {
  const images = {
    python: {
      image: 'docker.io/library/python:3.9',
      cmd: ['python', '-c', code],
    },
    php: {
      image: 'docker.io/library/php:8.2-cli',
      cmd: ['php', '-r', code],
    },
    typescript: {
      image: 'docker.io/library/node:20',
      cmd: [
        'sh',
        '-c',
        `
echo "${code}" > script.ts && \
npm install -g typescript --silent --no-progress --loglevel=error && \
tsc script.ts --target es2016 --module commonjs --skipLibCheck && \
node script.js
  `.trim(),
      ],
    },
  }

  if (!images[language]) throw new Error(`Unsupported language: ${language}`)
  return images[language]
}

async function runCode(language, code) {
  const { image, cmd } = getImageAndCmd(language, code)

  const docker = new Docker()
  await docker.pull(image)

  const container = await docker.createContainer({
    Image: image,
    Cmd: cmd,
    Tty: false,
    HostConfig: {
      Memory: 100 * 1024 * 1024,
      // NetworkMode: 'none',
    },
  })

  await container.start()

  const { StatusCode } = await container.wait()

  const logs = await container.logs({ stdout: true, stderr: true })
  await container.remove()

  return {
    output: logs
      .toString('utf8')
      .replace(/(\x01|\x02)\x00\x00\x00\x00\x00\x00./g, '')
      .trim(),
    success: StatusCode === 0,
  }
}

app.use(express.json())
app.use(cors())

app.get('/', (_req, res) => {
  res.json('Hello world')
})

app.post('/execute', async (req, res) => {
  const { language, code } = req.body
  try {
    const { output, success } = await runCode(language, code)
    console.log('output: ', output)
    res.json({ success, output })
  } catch (err) {
    console.log('err: ', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(5000, () => {
  console.log('Server started')
})
