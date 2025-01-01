const Airtable = require('airtable');

// Configure Airtable - using existing environment variables
const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Received event:', event.body);
    const payload = JSON.parse(event.body);
    
    // Log the parsed payload for debugging
    console.log('Parsed payload:', payload);

    // Find and update the record in Airtable
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `AND(
        {Customer Name} = '${payload.customerName}',
        {Week} = '${payload.date}'
      )`
    }).firstPage();

    console.log('Found records:', records);

    if (records.length > 0) {
      // Update the extras field
      const updatedRecord = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
        'Extras': payload.extras.join(', ')
      });
      
      console.log('Updated record:', updatedRecord);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Add-ons updated successfully',
          record: updatedRecord
        })
      };
    } else {
      console.log('No records found for:', payload);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Record not found' })
      };
    }

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
