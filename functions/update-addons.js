const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  try {
    const records = await base('Orders').select({
      filterByFormula: `AND(
        {Customer Name} = 'Berny',
        {Week} = '1/6/2025',
        {Day} = 'monday'
      )`
    }).firstPage();

    if (records.length > 0) {
      const updated = await base('Orders').update(records[0].id, {
        'Extras': 'TEST BERNY EXTRAS'
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          fields: updated.fields
        })
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Record not found' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
