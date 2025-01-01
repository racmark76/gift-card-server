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
    // First, let's get ALL records to see what's in Airtable
    console.log('Getting all records...');
    const allRecords = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 10
    }).firstPage();

    console.log('First few records in Airtable:');
    allRecords.forEach(record => {
      console.log({
        customerName: record.fields['Customer Name'],
        week: record.fields['Week'],
        day: record.fields['Day']
      });
    });

    // Now process our update
    const webhookData = JSON.parse(event.body);
    const { customerInfo, orderDetails } = webhookData[0];

    // For debugging, log what we're looking for
    console.log('Looking for:', {
      customerName: customerInfo.name,
      order: orderDetails.orders[0]
    });

    // Try just finding by customer name first
    const customerRecords = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${customerInfo.name}'`
    }).firstPage();

    console.log('Records found by customer name:', customerRecords.length);
    
    if (customerRecords.length > 0) {
      console.log('Sample customer record:', {
        customerName: customerRecords[0].fields['Customer Name'],
        week: customerRecords[0].fields['Week'],
        day: customerRecords[0].fields['Day']
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug information',
        totalRecords: allRecords.length,
        customerRecords: customerRecords.length,
        sampleData: allRecords[0]?.fields,
        lookingFor: {
          customerName: customerInfo.name,
          week: orderDetails.orders[0].week,
          day: orderDetails.orders[0].day
        }
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
