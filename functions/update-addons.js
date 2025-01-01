const Airtable = require('airtable');

// Configure Airtable
const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  console.log('1. Function started');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    console.log('2. Raw event body:', event.body);
    
    // Parse the webhook data
    const webhookData = JSON.parse(event.body)[0];
    console.log('3. Parsed webhook data:', JSON.stringify(webhookData, null, 2));
    
    const { customerInfo, orderDetails } = webhookData;
    console.log('4. Customer info:', customerInfo);
    console.log('5. Order details:', orderDetails);

    // First, let's just try to get ANY records from the table
    console.log('6. Attempting to read from Airtable');
    const testRecords = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 1
    }).firstPage();
    console.log('7. Test record fields:', testRecords[0]?.fields);

    // Now try our actual query
    console.log('8. Searching for customer:', customerInfo.name);
    const customerRecords = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${customerInfo.name}'`
    }).firstPage();
    console.log('9. Found customer records:', customerRecords.length);

    if (customerRecords.length > 0) {
      console.log('10. Customer record fields:', customerRecords[0].fields);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Debug run completed',
        foundRecords: customerRecords.length
      })
    };

  } catch (error) {
    console.error('Error occurred:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error', 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};
