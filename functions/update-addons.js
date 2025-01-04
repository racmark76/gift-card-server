const express = require('express');
const router = express.Router();
const Airtable = require('airtable');

const base = new Airtable({
  apiKey: 'patySI8tdVaCy75dA.9e891746788af3b4420eb93e6cd76d866317dd4950b648196c88b0d9f0d51cf3'
}).base('appYJ9gWRBFOLfb0r');

router.post('/update-addons', async (req, res) => {
  try {
    // 1. Log the incoming request
    console.log('1. Raw request body:', JSON.stringify(req.body, null, 2));
    
    const data = req.body[0];
    const customerName = data.customerInfo.name;
    
    console.log('2. Processing for customer:', customerName);
    console.log('3. Available add-ons:', JSON.stringify(data.orderDetails.addOns, null, 2));

    // 4. Get ALL records first to see what's in Airtable
    const allRecords = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 10
    }).all();
    
    console.log('4. Sample records in Airtable:', allRecords.slice(0, 3).map(r => ({
      customer: r.get('Customer Name'),
      day: r.get('Day'),
      week: r.get('Week')
    })));

    // 5. Now get records for this customer
    const records = await base('tblM6K7Ii11HBkrW9').select({
      filterByFormula: `{Customer Name} = '${customerName}'`
    }).all();

    console.log(`5. Found ${records.length} records for ${customerName}:`, 
      records.map(r => ({
        id: r.id,
        day: r.get('Day'),
        week: r.get('Week')
    })));

    // 6. Process updates
    const updates = [];
    for (const record of records) {
      const day = record.get('Day');
      const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      
      console.log(`6. Processing ${day} (${capitalizedDay})`);
      console.log('7. Looking for add-ons in:', Object.keys(data.orderDetails.addOns));
      
      const dayAddOns = data.orderDetails.addOns[capitalizedDay];
      if (dayAddOns && dayAddOns.length > 0) {
        const extrasString = dayAddOns.map(addon => 
          `${addon.name} (${addon.quantity})`
        ).join(', ');

        console.log(`8. Will update ${day} with: ${extrasString}`);
        
        try {
          const updated = await base('tblM6K7Ii11HBkrW9').update(record.id, {
            'Extras': extrasString
          });
          
          console.log(`9. Update successful:`, {
            id: updated.id,
            extras: updated.get('Extras')
          });
          
          updates.push({
            day,
            extras: extrasString
          });
        } catch (error) {
          console.error(`Error updating ${day}:`, error);
        }
      } else {
        console.log(`No add-ons found for ${capitalizedDay}`);
      }
    }

    console.log('10. Final updates:', updates);

    res.json({
      success: true,
      recordsFound: records.length,
      updates: updates,
      message: 'Process completed'
    });

  } catch (error) {
    console.error('Main error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;


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
