const fetch = require('node-fetch')
const os = require('os')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

module.exports = {
  request: async (url, options={}) => {
    let start = +new Date()

    let body
    let error

    let fullOptions = {
      timeout: 2000,
      compress: true,
      ...options
    }

    for (let i = 0; i < 3; i++) {
      try {
        body = await fetch(url, fullOptions)

        break
      } catch (e) {
        error = e
      }
    }

    if (!body && error) throw error

    let end = +new Date()
    let diff = end - start
    console.log(`${diff}ms ${url}`)

    if (options.raw) return body
    else return body.text()
  },
  getMCPath: () => {
    let osType = os.type()
    let homedir = os.homedir()

    if (osType === 'Darwin') {
      return path.join(homedir, 'Library', 'Application Support', 'minecraft', 'rails_1.12.2')
    } else if (osType === 'Windows_NT') {
      return path.join(homedir, '%APPDATA%', '.minecraft', 'rails_1.12.2')
    } else {
      return path.join(homedir, '.minecraft', 'rails_1.12.2')
    }
  },
  mkdir: path => {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, {recursive: true}, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  },
  remove: path => {
    return new Promise((resolve, reject) => {
      fs.unlink(path, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  },
  hashFile: path => {
    return new Promise(resolve => {
      try {
        let fd = fs.createReadStream(path)
        let hash = crypto.createHash('sha512')
        hash.setEncoding('hex')

        fd.on('end', () => {
          hash.end()
          resolve(hash.read())
        })

        fd.on('error', () => {
          resolve(null)
        })

        fd.pipe(hash)
      } catch (e) { resolve(null) }
    })
  }
}
