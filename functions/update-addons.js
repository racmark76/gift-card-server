const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

function formatDate(dateStr) {
  const [month, day, year] = dateStr.split('/');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // Parse the incoming data
    const webhookData = JSON.parse(event.body);
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));
    
    const { customerInfo, orderDetails } = webhookData[0];
    
    // Process each order
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Format the date to match Airtable (1/6/2025)
      const formattedDate = formatDate(order.week);
      
      // Find the matching record
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${formattedDate}',
          {Day} = '${order.day}'
        )`
      }).firstPage();

      if (records.length > 0) {
        // Check if there are add-ons for this day
        const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
        const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
        
        // Format add-ons string
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`Updating ${order.day} with extras:`, extrasString);

        // Update the record
        return await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString
        });
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
        updates: successfulUpdates,
        searchCriteria: orderDetails.orders.map(order => ({
          customerName: customerInfo.name,
          week: formatDate(order.week),
          day: order.day,
          hasAddOns: !!orderDetails.addOns[order.day.charAt(0).toUpperCase() + order.day.slice(1)]
        }))
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
        receivedBody: event.body
      })
    };
  }
};
