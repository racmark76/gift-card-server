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

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the webhook data
    const webhookData = JSON.parse(event.body)[0]; // Get first element since it's an array
    const { customerInfo, orderDetails } = webhookData;
    
    // Process each day's order and its add-ons
    const updatePromises = orderDetails.orders.map(async (order) => {
      const dayLowerCase = order.day.toLowerCase();
      
      // Get add-ons for this specific day
      const dayAddOns = orderDetails.addOns[order.day] || orderDetails.addOns[order.day.charAt(0).toUpperCase() + order.day.slice(1)] || [];
      
      // Format add-ons string
      const extrasString = dayAddOns.map(addon => 
        `${addon.name} (${addon.quantity})`
      ).join(', ');

      console.log(`Updating ${dayLowerCase} for ${customerInfo.name} with extras: ${extrasString}`);

      // Find and update the record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${order.week}',
          {Day} = '${dayLowerCase}'
        )`
      }).firstPage();

      if (records.length > 0) {
        return base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString || '' // Use empty string if no extras
        });
      } else {
        console.log(`No record found for ${customerInfo.name} on ${order.week} ${dayLowerCase}`);
        return null;
      }
    });

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Add-ons updated successfully',
        updates: results.filter(r => r !== null).length
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
