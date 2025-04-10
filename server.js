import express from 'express'
import cors from 'cors'
import Docker from 'dockerode'

const docker = new Docker({ socketPath: '/var/run/docker.sock' })

const app = express()

// typescript

const getImageAndCmd = (language, code) => {
  if (language === 'python') {
    return { image: 'python:3.9', cmd: ['python', '-c', code] }
  }
  if (language === 'php') {
    return { image: 'php:8.2-cli', cmd: ['php', '-r', code] }
  }
}

async function runCode(language, code) {
  const { image, cmd } = getImageAndCmd(language, code)
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
