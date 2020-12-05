const axios = require('axios')
const fs = require('fs')
const { mergeDeepRight } = require('ramda')

const serverUrl = process.env.API_URL
const pass = process.env.LOCALE_PASS

module.exports = () => {
  const axiosApi = axios.create({
    baseURL: `${serverUrl}/api/v1`,
    timeout: 100000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  axiosApi
    .get(`/locale/locales-with-namespaces/${pass}`)
    .then((response: { data: { locales: string[]; namespaces: string[] } }) => {
      const { locales, namespaces } = response.data
      locales.forEach((locale: string) => {
        namespaces.forEach((namespace: string) => {
          axiosApi
            .get(`/locale/${locale}/${namespace}/${pass}`)
            .then((localeFileResponse: { data: Object }) => {
              const folder = `${process.cwd()}/public/static/locales/${locale}`
              const defaultFolder = `${process.cwd()}/public/static/defaultLocales/${locale}`
              const file = `${namespace}.json`
              const fullPath = `${folder}/${file}`
              const fullPathDefault = `${defaultFolder}/${file}`
              if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true })
              }
              let defaultData = {}
              if (fs.existsSync(fullPathDefault)) {
                defaultData = JSON.parse(fs.readFileSync(fullPathDefault))
              }
              fs.writeFileSync(fullPath, JSON.stringify(mergeDeepRight(defaultData, localeFileResponse.data)))
              console.info(`Locale saved: /locale/${locale}/${namespace}`)
            })
            .catch((e: Object) => {
              console.error(`Cannot get locales: ${locale}/${namespace}`)
              console.error(e)
            })
        })
      })
    })
    .catch((e: Object) => {
      console.error('Cannot get locales with namespaces')
      console.error(e)
    })
}
