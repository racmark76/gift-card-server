const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

// Helper function to delay between updates
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function updateRecord(record, addOns) {
  const day = record.get('Day');
  const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
  const dayAddOns = addOns[capitalizedDay] || [];

  if (dayAddOns.length > 0) {
    const extrasString = dayAddOns.map(addon => 
      `${addon.name} (${addon.quantity})`
    ).join(', ');

    try {
      await base('tblM6K7Ii11HBkrW9').update(record.id, {
        'Extras': extrasString
      });

      // Wait a bit after each update
      await delay(500);
      
      return { 
        day, 
        success: true, 
        extras: extrasString
      };
    } catch (error) {
      console.error(`Error updating ${day}:`, error);
      return { 
        day, 
        success: false, 
        error: error.message 
      };
    }
  }
  return { day, success: true, extras: null };
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
    const data = JSON.parse(event.body)[0];
    
    // Get all records
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${data.customerInfo.name}'`
    }).all();

    // Process records sequentially with delay
    const updates = [];
    for (const record of records) {
      const result = await updateRecord(record, data.orderDetails.addOns);
      updates.push(result);
      await delay(500); // Wait between records
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        customerName: data.customerInfo.name,
        updates: updates,
        processedCount: updates.length,
        addOnDays: Object.keys(data.orderDetails.addOns)
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
