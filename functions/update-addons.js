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
    console.log('Received event body:', event.body);
    
    // Parse the webhook data
    const webhookData = JSON.parse(event.body);
    console.log('Parsed webhook data:', webhookData);

    // Validate data structure
    if (!Array.isArray(webhookData) || !webhookData[0]?.customerInfo?.name) {
      throw new Error('Invalid data structure');
    }

    const { customerInfo, orderDetails } = webhookData[0];
    console.log('Processing order for customer:', customerInfo.name);

    // Process each day's order and its add-ons
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Get add-ons for this specific day
      const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
      const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
      
      // Format add-ons string
      const extrasString = dayAddOns.map(addon => 
        `${addon.name} (${addon.quantity})`
      ).join(', ');

      console.log(`Looking for record: ${customerInfo.name}, ${order.week}, ${order.day}`);

      // Find and update the record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${order.week}',
          {Day} = '${order.day}'
        )`
      }).firstPage();

      if (records.length > 0) {
        console.log(`Updating record for ${order.day} with extras:`, extrasString);
        return await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString
        });
      } else {
        console.log(`No record found for ${order.day}`);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(r => r !== null).length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Add-ons updated successfully',
        updates: successfulUpdates
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message,
        body: event.body
      })
    };
  }
};
