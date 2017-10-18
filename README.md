# Matrix Password Reset server

Simple server to accept a `username`, `password` and secret `token` to change a password in the matrix-synapse database.

Currently only works on SQLite3 but it should be quite easy to change this to any other database supported by synapse.

## Usage

Make sure you have the requirements:
- A working matrix server
- A valid SSL certificate

`npm install`

`TOKEN=123 CERT_PATH=/etc/letsencrypt/live/mywebsite.com node index.js`

It should accept connections on `https://www.mywebsite.com:5000/matrix-password-reset`.


POST the following:
```json
{
  "username": "@user:matrixserver",
  "password": "supersafe",
  "token": "123"
}
```

## Contributing

Make a PR or submit an issue <3
