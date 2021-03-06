import { log } from '../system/log'
import { r } from '../system/rethinkclient'
import { createUserDocument } from './create'
import { loadToRedis } from './read'
const Config = require('../botconfig.json')
const Raven = require('raven')
Raven.config(Config.raven.url).install()

function updateGuildDocument (guildID, toUpdate) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Guilds').get(guildID).update(toUpdate).run().then((response) => {
      if (response.replaced || response.skipped || response.unchanged || response.inserted) {
        resolve(true)
        loadToRedis(guildID)
      } else {
        resolve(response)
      }
    })
  })
}

function updateUserDocument (userID, toUpdate) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Users').get(userID).update(toUpdate).run().then((response) => {
      if (response.replaced || response.skipped || response.unchanged) {
        resolve(true)
      } else {
        resolve(response)
      }
    }).catch(() => {
      createUserDocument(userID).then((res) => {
        if (res !== true) {
          log.error(res)
        }
      })
      resolve(false)
    })
  })
}

function addNewName (userID, nameStr) {
  return new Promise((resolve, reject) => {
    r.db('Logger').table('Users').get(userID).run().then((userDoc) => {
      userDoc.names.push(nameStr)
      r.db('Logger').table('Users').get(userID).update({'names': userDoc.names}).run().then((response) => {
        if (response.replaced || response.skipped || response.unchanged) {
          resolve(true)
        } else {
          resolve(response)
        }
      })
    }).catch(() => {
      createUserDocument(userID).then((res) => {
        if (res === true) {
          r.db('Logger').table('Users').get(userID).update({'names': [nameStr]}).run().then((response) => {
            if (response.replaced || response.skipped || response.unchanged) {
              resolve(true)
            } else {
              resolve(response)
            }
          })
        } else {
          log.error(res)
        }
      })
    })
  })
}

export { updateGuildDocument, updateUserDocument, addNewName }
