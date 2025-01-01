const Airtable = require('airtable');

// Configure Airtable
const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

// Function to format date (remove leading zeros)
function formatDate(dateStr) {
  return dateStr.replace(/^0+|\/0+/g, '/');
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // Parse the webhook data
    const webhookData = JSON.parse(event.body);
    const { customerInfo, orderDetails } = webhookData[0];

    // Process each day's order and its add-ons
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Format the date by removing leading zeros
      const formattedDate = formatDate(order.week);
      
      // Get add-ons for this specific day
      const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
      const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
      
      console.log('Searching for:', {
        customerName: customerInfo.name,
        week: formattedDate,
        day: order.day,
        addOns: dayAddOns
      });

      // Find and update the record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${formattedDate}',
          {Day} = '${order.day}'
        )`
      }).firstPage();

      console.log(`Found ${records.length} records for ${order.day}`);

      if (records.length > 0) {
        // Format add-ons string
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`Updating ${order.day} with extras:`, extrasString);

        // Update the record
        const updated = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString
        });

        console.log(`Updated ${order.day} successfully`);
        return updated;
      }

      return null;
    });

    // Wait for all updates to complete
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
