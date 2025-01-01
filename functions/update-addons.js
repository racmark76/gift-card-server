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
    // Get first 5 records to check what we're dealing with
    const checkRecords = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 5
    }).firstPage();

    console.log('Sample records:', checkRecords.map(r => ({
      id: r.id,
      name: r.get('Customer Name'),
      day: r.get('Day'),
      week: r.get('Week'),
      extras: r.get('Extras')
    })));

    // Now try to update one specific record
    const firstRecord = checkRecords[0];
    if (firstRecord) {
      console.log('Attempting to update record:', firstRecord.id);
      
      const updated = await base('tblM6K7Ii11HBkrW9').update(firstRecord.id, {
        'Extras': 'Test Update'
      });

      console.log('Update result:', {
        id: updated.id,
        extras: updated.get('Extras')
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug run complete',
        recordsFound: checkRecords.length,
        updateAttempted: firstRecord ? true : false
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
