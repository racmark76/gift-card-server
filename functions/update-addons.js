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
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));
    
    const { customerInfo, orderDetails } = webhookData;
    
    // Process each day's order and its add-ons
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Convert date format from 01/06/2025 to 1/6/2025
      const formattedDate = order.week.replace(/^0|\/0/g, '/');
      
      // Get add-ons for this specific day
      const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
      const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
      
      // Format add-ons string
      const extrasString = dayAddOns.map(addon => 
        `${addon.name} (${addon.quantity})`
      ).join(', ');

      const filterFormula = `AND(
        {Customer Name} = '${customerInfo.name}',
        {Week} = '${formattedDate}',
        {Day} = '${order.day.toLowerCase()}'
      )`;

      console.log('Searching with:', {
        customerName: customerInfo.name,
        week: formattedDate,
        day: order.day.toLowerCase(),
        filterFormula
      });

      // Find and update the record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: filterFormula
      }).firstPage();

      console.log('Found records:', records.length);

      if (records.length > 0) {
        console.log('Updating record with extras:', extrasString);
        return await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString
        });
      } else {
        console.log('No record found matching criteria');
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
        updates: successfulUpdates,
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
