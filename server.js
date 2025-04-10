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
  }

  if (!images[language]) throw new Error(`Unsupported language: ${language}`)
  return images[language]
}

async function runCode(language, code) {
  const { image, cmd } = getImageAndCmd(language, code)

  const docker = new Docker()
  await docker.pull('docker.io/library/python:3.9')

  const container = await docker.createContainer({
    Image: image,
    Cmd: cmd,
    Tty: false,
    HostConfig: {
      AutoRemove: true,
      Memory: 100 * 1024 * 1024,
      NetworkMode: 'none',
    },
  })

  await container.start()
  await container.wait()

  const logs = await container.logs({
    stdout: true,
    stderr: true,
    follow: false,
    timestamps: false,
  })

  // Удаляем ВСЕ Docker-заголовки (\x01... или \x02...)
  const cleanOutput = logs
    .toString('utf8')
    .replace(/(\x01|\x02)\x00\x00\x00\x00\x00\x00./g, '')
    .trim()

  return cleanOutput
}

app.use(express.json())
app.use(cors())

app.get('/', (_req, res) => {
  res.json('Hello world')
})

app.post('/execute', async (req, res) => {
  const { language, code } = req.body
  try {
    const output = await runCode(language, code)
    console.log('output: ', output)
    res.json({ success: true, output })
  } catch (err) {
    console.log('err: ', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(5000, () => {
  console.log('Server started')
})
