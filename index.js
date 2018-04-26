const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const https = require('https')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const fs = require('fs')
const app = express()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

const TOKEN = process.env.TOKEN
const CERT_PATH = process.env.CERT_PATH // Maybe something like: '/etc/letsencrypt/live/mywebsite.com'
const PORT = process.env.PORT || 5000
const DATABASE_PATH = '/var/lib/matrix-synapse/homeserver.db'

if (!TOKEN) throw new Error('missing TOKEN env')
if (!CERT_PATH) throw new Error('missing CERT_PATH env')

console.log('Starting server with env vars')
console.log('CERT_PATH:', CERT_PATH)
console.log('PORT:', PORT)
console.log('DATABASE_PATH:', DATABASE_PATH)

app.get('/health-check', async function (req, res) {
  res.sendStatus(200)
})

app.post('/matrix-password-reset', async function (req, res) {
  const { username, password, token } = req.body

  if (token !== TOKEN) {
    return res.sendStatus(403)
  }

  if (!username || !password) {
    return res.status(400).json({
      error: 'missing username or password'
    })
  }

  if (username.indexOf('@') === -1 || username.indexOf(':') === -1) {
    return res.status(400).json({
      error: 'username must be in @user:matrixserver format'
    })
  }

  const SALT_FACTOR = 12

  let salt
  try {
    salt = await bcrypt.genSalt(SALT_FACTOR)
  } catch (error) {
    return res.status(500).json({
      error: 'something went wrong during salting'
    })
  }

  let hash
  try {
    hash = await bcrypt.hash(password, salt)
  } catch (error) {
    return res.status(500).json({
      error: 'something went wrong during hashing: ' + error.message
    })
  }

  const query = `
UPDATE users
SET password_hash = "${hash}"
WHERE name = "${username}"
  `

  const db = new sqlite3.Database(DATABASE_PATH)

  db.run(query, [], (error) => {
    if (error) {
      return res.status(500).json({
        error: 'something went wrong during saving to database: ' + error.message
      })
    }

    return res.status(200).json({
      message: 'saving succesful',
      changes: this.changes
    })
  })

  db.close()
})

https.createServer({
  key: fs.readFileSync(path.join(CERT_PATH + '/privkey.pem')),
  cert: fs.readFileSync(path.join(CERT_PATH, '/cert.pem'))
}, app).listen(5000)
