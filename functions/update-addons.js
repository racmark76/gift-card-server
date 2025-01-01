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
    console.log('Order contains days:', data.orderDetails.orders.map(o => o.day));
    console.log('Add-ons available for:', Object.keys(data.orderDetails.addOns));

    // Get all records for this customer
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${data.customerInfo.name}'`
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
      const week = record.get('Week');
      
      console.log(`\nProcessing record for ${day} (${week})`);
      console.log('Looking for add-ons with key:', capitalizedDay);
      
      const dayAddOns = data.orderDetails.addOns[capitalizedDay] || [];
      
      if (dayAddOns.length > 0) {
        console.log(`Found add-ons for ${day}:`, dayAddOns);
        
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        try {
          await base('tblM6K7Ii11HBkrW9').update([{
            id: record.id,
            fields: {
              'Extras': extrasString
            }
          }]);
          console.log(`Successfully updated ${day} with: ${extrasString}`);
        } catch (updateError) {
          console.error(`Failed to update ${day}:`, updateError);
        }

        // Wait between updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`No add-ons found for ${day}`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        customerName: data.customerInfo.name,
        orderedDays: data.orderDetails.orders.map(o => o.day),
        foundRecords: records.map(r => r.get('Day')),
        addOnsAvailable: Object.keys(data.orderDetails.addOns)
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
