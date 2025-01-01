const Airtable = require('airtable');

// Configure Airtable
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
    console.log('Received body:', event.body);
    const data = JSON.parse(event.body);
    const { customerInfo, currentDay, week, addOns } = data;
    
    console.log('Processing update for:', {
      customer: customerInfo.name,
      day: currentDay,
      week: week,
      addOns: addOns
    });

    // Find the specific record for this customer and day
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `AND(
        {Customer Name} = '${customerInfo.name}',
        {Week} = '${week}',
        {Day} = '${currentDay.toLowerCase()}'
      )`
    }).firstPage();

    if (records.length > 0) {
      // Format add-ons string
      const extrasString = addOns 
        ? addOns.map(addon => `${addon.name} (${addon.quantity})`).join(', ')
        : '';

      // Update the record
      await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
        'Extras': extrasString
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Add-on updated successfully',
          day: currentDay,
          extras: extrasString
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        message: 'Record not found',
        day: currentDay
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
