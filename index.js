const utils = require('./utils')
const mcUtils = require('./mc-utils')
const fs = require('fs')

async function main() {
  await mcUtils.ensureMCStructure()
  await mcUtils.downloadFiles()
  await mcUtils.addLauncherProfile()
  await mcUtils.installForgeVersion('1.12.2-forge-14.23.5.2854')
}

main()
