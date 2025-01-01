const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

// Function to remove leading zeros from date parts
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
    const webhookData = JSON.parse(event.body);
    const { customerInfo, orderDetails } = webhookData[0];
    
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Convert "01/06/2025" to "1/6/2025"
      const formattedDate = formatDate(order.week);
      
      console.log('Searching for:', {
        customerName: customerInfo.name,
        week: formattedDate,
        day: order.day
      });

      // First try to find the record
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${formattedDate}',
          {Day} = '${order.day}'
        )`
      }).firstPage();

      console.log(`Found ${records.length} records for ${order.day}`);

      if (records.length > 0) {
        // Get add-ons for this specific day
        const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
        const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
        
        // Format add-ons string
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`Updating ${order.day} with extras:`, extrasString);

        // Update the record
        const updated = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString
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
        updates: successfulUpdates,
        searchCriteria: orderDetails.orders.map(order => ({
          customerName: customerInfo.name,
          week: formatDate(order.week),
          day: order.day
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
        error: error.message
      })
    };
  }
};
