const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  try {
    // Just try to read records from Airtable
    const records = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 3
    }).firstPage();

    // Return what we found
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Found records',
        records: records.map(record => ({
          name: record.get('Customer Name'),
          day: record.get('Day'),
          week: record.get('Week')
        }))
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error reading Airtable',
        error: error.message
      })
    };
  }
};
