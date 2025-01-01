const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  try {
    // Find Berny's specific order
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `AND(
        {Customer Name} = 'Berny',
        {Week} = '1/6/2025',
        {Day} = 'monday'
      )`
    }).firstPage();

    if (records.length > 0) {
      const updated = await base('tblM6K7Ii11HBkrW9').update([
        {
          "id": records[0].id,
          "fields": {
            "Extras": "TEST BERNY ORDER"
          }
        }
      ]);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          recordId: records[0].id,
          before: records[0].fields,
          after: updated[0].fields
        })
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        message: 'Berny order not found'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
