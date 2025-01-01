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
    // Parse the webhook data
    const webhookData = JSON.parse(event.body)[0];
    console.log('Received Data:', JSON.stringify(webhookData, null, 2));
    
    const { customerInfo, orderDetails } = webhookData;
    
    // Process each day's order and its add-ons
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Get add-ons for this specific day
      const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
      const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
      
      // Format add-ons string
      const extrasString = dayAddOns.map(addon => 
        `${addon.name} (${addon.quantity})`
      ).join(', ');

      console.log('Searching for:', {
        customerName: customerInfo.name,
        week: order.week,
        day: order.day
      });

      // Find record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${order.week}',
          {Day} = '${order.day}'
        )`
      }).firstPage();

      console.log('Found Records:', records.length);

      if (records.length > 0) {
        console.log('Updating record with Extras:', extrasString);
        const updated = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString // Using exact column name 'Extras'
        });
        return updated;
      }
      return null;
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
        error: error.message 
      })
    };
  }
};
