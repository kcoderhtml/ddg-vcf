const faunadb = require('faunadb')
const faunaClient = new faunadb.Client({ secret: process.env.FAUNADB_SERVER_SECRET })
const q = faunadb.query

const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST'){
      return { statusCode: 500, body: 'POST OR BUST!' }
    }
    
    const subject = event.queryStringParameters.name || 'World'
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello ${subject}` }),
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
      
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }
