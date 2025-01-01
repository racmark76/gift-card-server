const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

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
    const data = JSON.parse(event.body)[0];
    console.log('Processing order for:', data.customerInfo.name);
    console.log('Add-ons received:', JSON.stringify(data.orderDetails.addOns, null, 2));

    // Get all orders for the specific dates in the order
    const dates = data.orderDetails.orders.map(order => order.week);
    const orderDays = data.orderDetails.orders.map(order => order.day);
    
    console.log('Looking for days:', orderDays);
    console.log('Looking for dates:', dates);

    // Build OR filter for each day/date combination
    const filters = data.orderDetails.orders.map(order => 
      `AND({Customer Name} = '${data.customerInfo.name}', 
           {Week} = '${order.week}', 
           {Day} = '${order.day}')`
    );

    const formula = `OR(${filters.join(', ')})`;
    console.log('Using filter:', formula);

    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: formula
    }).all();

    console.log(`Found ${records.length} records:`, 
      records.map(r => ({
        day: r.get('Day'),
        week: r.get('Week')
      }))
    );

    // Process each record
    for (const record of records) {
      const day = record.get('Day');
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      
      console.log(`Processing ${day}`);
      const dayAddOns = data.orderDetails.addOns[capitalizedDay] || [];
      
      if (dayAddOns.length > 0) {
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`Updating ${day} with: ${extrasString}`);
        
        try {
          await base('tblM6K7Ii11HBkrW9').update([{
            id: record.id,
            fields: {
              'Extras': extrasString
            }
          }]);
          console.log(`Successfully updated ${day}`);
        } catch (error) {
          console.error(`Error updating ${day}:`, error);
        }

        // Wait between updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        recordsFound: records.length,
        daysProcessed: records.map(r => r.get('Day'))
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};



// const Airtable = require('airtable');

// const base = new Airtable({
//   apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
// }).base('appYJ9gWRBFOLfb0r');

// exports.handler = async (event, context) => {
//   const headers = {
//     'Access-Control-Allow-Origin': 'https://bot.eitanerd.com',
//     'Access-Control-Allow-Headers': 'Content-Type',
//     'Access-Control-Allow-Methods': 'POST, OPTIONS'
//   };

//   if (event.httpMethod === 'OPTIONS') {
//     return { statusCode: 200, headers, body: '' };
//   }

//   try {
//     const data = JSON.parse(event.body)[0];
//     const matches = [];

//     // Get all records for this customer
//     const records = await base('tblM6K7Ii11HBkrW9').select({
//       filterByFormula: `{Customer Name} = '${data.customerInfo.name}'`
//     }).all();

//     // Match records with add-ons
//     records.forEach(record => {
//       const recordDay = record.get('Day');
//       const dayCapitalized = recordDay.charAt(0).toUpperCase() + recordDay.slice(1);
      
//       if (data.orderDetails.addOns[dayCapitalized]) {
//         matches.push({
//           recordId: record.id,
//           addOns: data.orderDetails.addOns[dayCapitalized]
//         });
//       }
//     });

//     // Update matched records
//     const updates = await Promise.all(matches.map(match => {
//       const extrasString = match.addOns
//         .map(addon => `${addon.name} (${addon.quantity})`)
//         .join(', ');
        
//       return base('tblM6K7Ii11HBkrW9').update(match.recordId, {
//         'Extras': extrasString
//       });
//     }));

//     return {
//       statusCode: 200,
//       headers,
//       body: JSON.stringify({
//         success: true,
//         updates: updates.length
//       })
//     };

//   } catch (error) {
//     console.error('Error:', error);
//     return {
//       statusCode: 500,
//       headers,
//       body: JSON.stringify({
//         success: false,
//         error: error.message
//       })
//     };
//   }
// };
