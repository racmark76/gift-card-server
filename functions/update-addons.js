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

    // Build filter for all dates and days
    const dateFilters = data.orderDetails.orders.map(order => {
      const dateArr = order.week.split('/');
      const airtableDate = `${dateArr[2]}-${dateArr[0].padStart(2, '0')}-${dateArr[1].padStart(2, '0')}`;
      return `AND({Customer Name} = '${data.customerInfo.name}', {Week} = '${airtableDate}')`
    });

    const filterFormula = `OR(${dateFilters.join(', ')})`;
    console.log('Using filter:', filterFormula);

    // Get all matching records
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: filterFormula
    }).all();

    console.log('Found records:', records.map(r => ({
      day: r.get('Day'),
      week: r.get('Week')
    })));

    // Process updates
    const updates = [];
    for (const record of records) {
      const day = record.get('Day');
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      
      const dayAddOns = data.orderDetails.addOns[capitalizedDay] || [];
      
      if (dayAddOns.length > 0) {
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        try {
          console.log(`Updating ${day} with:`, extrasString);
          const updated = await base('tblM6K7Ii11HBkrW9').update(record.id, {
            'Extras': extrasString
          });
          updates.push({
            day,
            extras: extrasString,
            success: true
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error updating ${day}:`, error);
          updates.push({
            day,
            success: false,
            error: error.message
          });
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        customerName: data.customerInfo.name,
        recordsFound: records.length,
        updates: updates
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
