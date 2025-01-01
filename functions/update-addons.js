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
    // Log the incoming data
    console.log('Raw event body:', event.body);
    
    const data = JSON.parse(event.body)[0];
    console.log('Parsed data:', JSON.stringify(data, null, 2));
    
    // Log customer info
    console.log('Customer:', data.customerInfo.name);
    console.log('Add-ons received:', data.orderDetails.addOns);

    // Get all records first
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${data.customerInfo.name}'`
    }).all();

    console.log('Records found:', records.length);
    console.log('Record days:', records.map(r => r.get('Day')));

    let processedUpdates = [];

    // Process each record one at a time
    for (const record of records) {
      const day = record.get('Day');
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      
      console.log(`\nProcessing day: ${day}`);
      console.log(`Looking for add-ons with key: ${capitalizedDay}`);
      console.log('Available add-on keys:', Object.keys(data.orderDetails.addOns));

      const dayAddOns = data.orderDetails.addOns[capitalizedDay];
      console.log('Found add-ons:', dayAddOns);

      if (dayAddOns && dayAddOns.length > 0) {
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`Updating record ${record.id} for ${day} with: ${extrasString}`);

        try {
          const updated = await base('tblM6K7Ii11HBkrW9').update(record.id, {
            'Extras': extrasString
          });
          console.log(`Update successful for ${day}`);
          processedUpdates.push({
            day,
            success: true,
            extras: extrasString
          });
        } catch (updateError) {
          console.error(`Error updating ${day}:`, updateError);
          processedUpdates.push({
            day,
            success: false,
            error: updateError.message
          });
        }
      } else {
        console.log(`No add-ons found for ${day}`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        totalRecords: records.length,
        updates: processedUpdates,
        addOnDays: Object.keys(data.orderDetails.addOns)
      })
    };

  } catch (error) {
    console.error('Main error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
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
