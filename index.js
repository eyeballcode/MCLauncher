const utils = require('./utils')
const mcUtils = require('./mc-utils')
const fs = require('fs')

mcUtils.ensureMCStructure()
mcUtils.downloadFiles()
