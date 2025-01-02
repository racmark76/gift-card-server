const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

function formatToAirtableDate(dateStr) {
  // Convert from "01/20/2025" or "1/20/2025" to "2025-01-20"
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://bot.eitanerd.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const data = JSON.parse(event.body)[0];
    const customerName = data.customerInfo.name;

    // Get all the dates in the correct format
    const orderDates = data.orderDetails.orders.map(order => ({
      airtableDate: formatToAirtableDate(order.week),
      day: order.day
    }));

    console.log('Customer:', customerName);
    console.log('Order dates:', orderDates);

    // Create OR conditions for each date
    const dateConditions = orderDates.map(order => 
      `AND({Week} = '${order.airtableDate}', {Day} = '${order.day}')`
    );

    const formula = `AND({Customer Name} = '${customerName}', OR(${dateConditions.join(', ')}))`;
    console.log('Using filter:', formula);

    // Get matching records
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: formula
    }).all();

    console.log(`Found ${records.length} records`);

    // Process updates
    const updates = [];
    for (const record of records) {
      const day = record.get('Day');
      const week = record.get('Week');
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      
      const dayAddOns = data.orderDetails.addOns[capitalizedDay];
      if (dayAddOns && dayAddOns.length > 0) {
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        try {
          await base('tblM6K7Ii11HBkrW9').update(record.id, {
            'Extras': extrasString
          });
          updates.push({ day, week, extras: extrasString });
          console.log(`Updated ${day} (${week}) with: ${extrasString}`);
        } catch (error) {
          console.error(`Failed to update ${day} (${week}):`, error);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
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
