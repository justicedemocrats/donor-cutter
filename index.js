#!/usr/bin/env node
//Usage: node index.js <file> <district> <real>
//Example: node index.js donors.csv NY_14 real

const Baby = require('babyparse')
const fs = require('fs')
const moment = require('moment')
const actionkit = require('./actionkit')({
  base: process.env.ACTIONKIT_BASE, 
  username: process.env.ACTIONKIT_USERNAME, 
  password: process.env.ACTIONKIT_PASSWORD
})

async function mark_cuts() {
  try {
    const district = process.argv[3]
    const newData = []
    const isReal = process.argv[4] && process.argv[4] === 'real'
    const parsed = Baby.parseFiles(process.argv[2], {
      header: true
    }).data
    for (let index = 0; index < parsed.length; index++) {
      console.log(`Adding custom action to ${parsed[index].Email}`)
      if (parsed[index].Email) {
        const email = parsed[index].Email.split(';')[0]
        if (isReal) {
          let donorcutpage = await actionkit.get('page')
            .query({ name: 'donors_for_candidates' })
          if (donorcutpage.body.meta.total_count === 0) {
            donorcutpage = await actionkit.post('petitionpage')
              .send({ name: 'donors_for_candidates' })
          }
          const pageId = donorcutpage.body.objects[0].id
          const result = await actionkit.post('action')
            .send({
              email: email,
              page: 'donors_for_candidates',
              action_district: district
            })      
        }
        const person = parsed[index]
        const newPerson = {}
        Object.keys(person).forEach((key) => {
          if (key !== 'Email') {
            const newKey = key.replace(/_/g, " ")
            newPerson[newKey] = person[key]
          }        
        })
        newData.push(newPerson)
      }
    }
    const final = Baby.unparse(newData, { header: true })
    await fs.writeFileSync(`${moment().format('YYYY_MM_DD')}_JD_Donor_List_${district.toUpperCase().replace('-','_')}.csv`, final)
  } catch (ex) {
    console.log(ex)
  }
}

mark_cuts()