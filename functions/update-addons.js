const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // Find Berny's Monday order
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `AND(
        {Customer Name} = 'Berny',
        {Week} = '1/6/2025',
        {Day} = 'monday'
      )`
    }).firstPage();

    console.log('Found records:', records.length);

    if (records.length > 0) {
      // Try to update the Extras field
      const updated = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
        'Extras': 'Test Add-On'
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Update attempted',
          recordId: records[0].id,
          foundRecords: records.length,
          updatedRecord: {
            customerName: updated.fields['Customer Name'],
            week: updated.fields['Week'],
            day: updated.fields['Day'],
            extras: updated.fields['Extras']
          }
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        message: 'Record not found'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
