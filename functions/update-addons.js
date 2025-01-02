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
    // 1. First get the incoming data
    const data = JSON.parse(event.body)[0];
    console.log('\n1. Incoming Data:');
    console.log('Customer:', data.customerInfo.name);
    console.log('Order details:', JSON.stringify(data.orderDetails.orders, null, 2));

    // 2. Get ALL records from the table (limit to first 100)
    console.log('\n2. Checking ALL records in table:');
    const allRecords = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 100
    }).all();

    console.log('Total records found:', allRecords.length);
    console.log('Sample records:');
    allRecords.slice(0, 5).forEach(record => {
      console.log({
        id: record.id,
        customer: record.get('Customer Name'),
        day: record.get('Day'),
        week: record.get('Week'),
        mainDish: record.get('Main Dish')
      });
    });

    // 3. Try to find records just by date
    console.log('\n3. Searching by dates only:');
    for (const order of data.orderDetails.orders) {
      const dateRecords = await base('tblM6K7Ii11HBkrW9').select({
        filterByFormula: `{Week} = '${order.week}'`
      }).all();
      console.log(`Date ${order.week}: found ${dateRecords.length} records`);
    }

    // 4. Try to find records just by customer name
    console.log('\n4. Searching by customer name only:');
    const customerRecords = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${data.customerInfo.name}'`
    }).all();
    console.log(`Customer ${data.customerInfo.name}: found ${customerRecords.length} records`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug complete',
        totalRecords: allRecords.length,
        customerRecords: customerRecords.length
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
