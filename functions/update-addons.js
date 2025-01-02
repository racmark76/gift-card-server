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
    const customerName = data.customerInfo.name;
    console.log('\nDEBUG INFORMATION:');
    console.log('1. Customer name:', customerName);

    // First get ANY records for this customer
    console.log('\n2. Searching by customer name only...');
    const customerRecords = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${customerName}'`
    }).all();

    console.log('Found records:', customerRecords.length);
    if (customerRecords.length > 0) {
      console.log('Sample records:', customerRecords.map(r => ({
        customer: r.get('Customer Name'),
        day: r.get('Day'),
        week: r.get('Week'),
      })));
    }

    // Now try finding by specific weeks
    console.log('\n3. Order weeks we are looking for:');
    data.orderDetails.orders.forEach(order => {
      console.log(`- ${order.week} (${order.day})`);
    });

    // Try each date format
    console.log('\n4. Testing different date formats...');
    for (const order of data.orderDetails.orders) {
      const testFormats = [
        order.week, // Original format "01/20/2025"
        order.week.replace(/^0/, ''), // Remove leading zero "1/20/2025"
        order.week.replace(/\/0/g, '/'), // Remove all leading zeros "1/1/2025"
      ];

      for (const dateFormat of testFormats) {
        const testRecords = await base('tblM6K7Ii11HBkrW9').select({
          filterByFormula: `AND({Customer Name} = '${customerName}', {Week} = '${dateFormat}')`
        }).all();

        console.log(`Testing date format "${dateFormat}": found ${testRecords.length} records`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug complete - check logs',
        customerName: customerName,
        initialRecordsFound: customerRecords.length
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
