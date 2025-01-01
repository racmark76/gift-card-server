const Airtable = require('airtable');
Airtable.configure({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3',
  endpointUrl: 'https://api.airtable.com'
});

const base = Airtable.base('appYJ9gWRBFOLfb0r');

function formatDate(dateStr) {
  const [month, day, year] = dateStr.split('/');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://bot.eitanerd.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const webhookData = JSON.parse(event.body);
    console.log('Received data:', webhookData);
    
    const { customerInfo, orderDetails } = webhookData[0];
    
    const updatePromises = orderDetails.orders.map(async (order) => {
      const formattedDate = formatDate(order.week);
      console.log('Looking for record:', {
        customer: customerInfo.name,
        week: formattedDate,
        day: order.day
      });

      const records = await base('Orders').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Week} = '${formattedDate}',
          {Day} = '${order.day}'
        )`
      }).firstPage();

      if (records.length > 0) {
        const dayCapitalized = order.day.charAt(0).toUpperCase() + order.day.slice(1);
        const dayAddOns = orderDetails.addOns[dayCapitalized] || [];
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        return await base('Orders').update([{
          id: records[0].id,
          fields: {
            'Extras': extrasString
          }
        }]);
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
    console.error('Error details:', error);
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
