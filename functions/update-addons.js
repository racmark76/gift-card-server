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
      const dayLowerCase = order.day.toLowerCase();
      
      // Get add-ons for this specific day
      const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
      const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
      
      // Format add-ons string
      const extrasString = dayAddOns.map(addon => 
        `${addon.name} (${addon.quantity})`
      ).join(', ');

      const filterFormula = `AND(
        {Customer Name} = '${customerInfo.name}',
        {Week} = '${order.week}',
        {Day} = '${dayLowerCase}'
      )`;

      console.log('Searching with criteria:', {
        customerName: customerInfo.name,
        week: order.week,
        day: dayLowerCase,
        filterFormula
      });

      // Find and update the record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: filterFormula
      }).firstPage();

      console.log('Found records:', records.length, 
                  records.length > 0 ? JSON.stringify(records[0].fields, null, 2) : 'No records found');

      if (records.length > 0) {
        const updated = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString || ''
        });
        console.log('Updated record:', JSON.stringify(updated.fields, null, 2));
        return updated;
      } else {
        console.log(`No record found for ${customerInfo.name} on ${order.week} ${dayLowerCase}`);
        return null;
      }
    });

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(r => r !== null).length;
    
    console.log(`Completed with ${successfulUpdates} successful updates`);
    
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
