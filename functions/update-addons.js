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
    const webhookData = JSON.parse(event.body)[0];
    const { customerInfo, orderDetails } = webhookData;

    // Get all records for this customer
    const customerRecords = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${customerInfo.name}'`
    }).firstPage();

    console.log('Found records:', customerRecords.length);

    // Process updates
    const updatePromises = customerRecords.map(async (record) => {
      const recordDay = record.fields['Day'];  // Get the day from the record
      const dayCapitalized = recordDay.charAt(0).toUpperCase() + recordDay.slice(1);
      
      // Get add-ons for this day
      const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
      
      // Format add-ons string
      const extrasString = dayAddOns.map(addon => 
        `${addon.name} (${addon.quantity})`
      ).join(', ');

      console.log(`Updating ${recordDay} with extras:`, extrasString);

      // Update the record
      return await base('tblM6K7Ii11HBkrW9').update(record.id, {
        'Extras': extrasString
      });
    });

    // Wait for all updates
    const results = await Promise.all(updatePromises);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Add-ons updated successfully',
        updates: results.length
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
