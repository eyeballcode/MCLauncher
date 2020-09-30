const os = require('os')
const fs = require('fs')
const path = require('path')
const async = require('async')
const { exec } = require('child_process')
const utils = require('./utils')
const tempDir = require('temp-dir')

let baseURL = 'http://localhost:8004'
// let baseURL = 'http://moddedmc.transportsg.me'

module.exports = {
  ensureMCStructure: () => {
    let mcFolder = utils.getMCPath()

    return new Promise(async resolve => {
      await utils.mkdir(mcFolder)
      await utils.mkdir(path.join(mcFolder, 'config'))
      await utils.mkdir(path.join(mcFolder, 'mods'))
      resolve()
    })
  },
  getFileCachePath: () => {
    return path.join(utils.getMCPath(), 'files.json')
  },
  getFolderCachePath: () => {
    return path.join(utils.getMCPath(), 'folders.json')
  },
  getFileCache: () => {
    return new Promise(async (resolve, reject) => {
      fs.readFile(module.exports.getFileCachePath(), (err, data) => {
        if (data) resolve(JSON.parse(data))
        else resolve([])
      })
    })
  },
  downloadFileCache: () => {
    return new Promise(async (resolve, reject) => {
      let data = await utils.request(baseURL + '/rails/files.json')
      fs.writeFile(module.exports.getFileCachePath(), data, () => {
        resolve(JSON.parse(data))
      })
    })
  },
  downloadFolderCache: () => {
    return new Promise(async (resolve, reject) => {
      let data = await utils.request(baseURL + '/rails/folders.json')
      fs.writeFile(module.exports.getFolderCachePath(), data, () => {
        resolve(JSON.parse(data))
      })
    })
  },
  downloadFiles: async () => {
    let existingFileCache = await module.exports.getFileCache()
    let foldersRequired = await module.exports.downloadFolderCache()
    let filesRequired = await module.exports.downloadFileCache()
    let mcPath = utils.getMCPath()

    await async.forEach(foldersRequired, async folder => {
      await utils.mkdir(path.join(mcPath, folder))
    })

    await async.forEach(existingFileCache, async existingFile => {
      if (!filesRequired.some(file => file.path === existingFile.path)) {
        await utils.remove(path.join(mcPath, existingFile.type, existingFile.path))
      }
    })

    await async.forEach(filesRequired, newFile => {
      return new Promise(resolve => {
        let existing = existingFileCache.find(file => file.path === newFile.path)
        let destinationPath = path.join(mcPath, newFile.type, newFile.path)
        fs.stat(destinationPath, async (err, stat) => {
          let hash = await utils.hashFile(destinationPath)
          if (err || hash !== newFile.hash || !existing || (existing.hash !== newFile.hash)) {
            let fullURL = `${baseURL}/rails/${newFile.type}/${newFile.path}`

            for (let i = 0; i < 3; i++) {
              let data = await utils.request(fullURL, { raw: true })
              let fd = fs.createWriteStream(destinationPath)
              data.body.pipe(fd)

              let hash = await utils.hashFile(destinationPath)
              if (hash === newFile.hash) break
            }
            resolve()
          }
        })
      })
    })
  },
  addLauncherProfile: () => {
    return new Promise((resolve, reject) => {
      let mcBasePath = utils.getMCPath()
      let profilePath = path.join(mcBasePath, '..', 'launcher_profiles.json')
      fs.readFile(profilePath, (err, data) => {
        if (err) return reject('Missing or invalid launcher profile')
        let profileData = JSON.parse(data)

          profileData.profiles.JMSSModdedMC = {
            created: new Date().toISOString(),
            gameDir: mcBasePath,
            icon: 'Grass',
            javaArgs: '-Xmx3G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M',
            lastVersionId: '1.12.2-forge-14.23.5.2854',
            name: 'JMSS Modded MC',
            type: 'custom'
          }
        fs.writeFile(profilePath, JSON.stringify(profileData, null, 2), resolve)
        resolve()
      })
    })
  },
  installForgeVersion: async (version) => {
    return new Promise(async (resolve, reject) => {
      let mcBasePath = utils.getMCPath()
      let profilePath = path.join(mcBasePath, '..', 'versions', version)
      let profileFile = path.join(profilePath, version + '.json')

      fs.stat(profileFile, async (err, data) => {
        if (err||true) {
          await utils.mkdir(profilePath)

          let data = await utils.request(baseURL + '/rails/gamedata.json', { raw: true })
          let fd = fs.createWriteStream(profileFile)

          data.body.pipe(fd)
        }
      })
    })
  }
}
