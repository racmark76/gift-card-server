const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  try {
    // First get all records
    console.log('Getting records...');
    const records = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 1
    }).firstPage();

    if (records.length > 0) {
      console.log('Found record, attempting update...');
      const record = records[0];
      
      // Try to update the first record we find
      const updated = await base('tblM6K7Ii11HBkrW9').update([
        {
          "id": record.id,
          "fields": {
            "Extras": "TEST"
          }
        }
      ]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          recordId: record.id,
          before: record.fields,
          after: updated[0].fields
        })
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        message: 'No records found'
      })
    };

  } catch (error) {
    console.error('Update error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
