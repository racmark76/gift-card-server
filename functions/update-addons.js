const Airtable = require('airtable');

// Configure Airtable
const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

// Function to format date (remove leading zeros)
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
    console.log('Received body:', event.body);
    
    // Parse the webhook data
    const webhookData = JSON.parse(event.body);
    const { customerInfo, orderDetails } = webhookData[0];
    
    // Process each day's order and its add-ons
    const updatePromises = orderDetails.orders.map(async (order) => {
      // Format the date by removing leading zeros
      const formattedDate = formatDate(order.week);
      
      // Ensure day is lowercase
      const dayLowercase = order.day.toLowerCase();
      
      console.log('Searching for:', {
        customerName: customerInfo.name.toLowerCase(),
        week: formattedDate,
        day: dayLowercase
      });

      // Find the record in Airtable
      const records = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name.toLowerCase()}',
          {Week} = '${formattedDate}',
          {Day} = '${dayLowercase}'
        )`
      }).firstPage();

      console.log(`Found ${records.length} records for ${dayLowercase}`);

      if (records.length > 0) {
        // Get add-ons for this day
        const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
        const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
        
        // Format add-ons string
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`Updating ${dayLowercase} with extras:`, extrasString);

        // Update the record
        const updated = await base('tblM6K7Ii11HBkrW9').update(records[0].id, {
          'Extras': extrasString
        });

        console.log(`Updated record:`, updated.fields);
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
        updates: successfulUpdates,
        details: results.map(r => r?.fields || null)
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
        stack: error.stack
      })
    };
  }
};
