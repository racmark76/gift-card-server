
const Airtable = require('airtable');
require('dotenv').config();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://eitanerd.com',  // Adjust domain if needed
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handling preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // If the request is not POST, return Method Not Allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Try block for handling the main logic
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // Parse the incoming JSON body
    const data = JSON.parse(event.body);
    const { customerInfo, orderDetails } = data;

    console.log('Received data:', data);

    // Process each order in the order details
    for (const order of orderDetails.orders) {
      const dayKey = order.day.charAt(0).toUpperCase() + order.day.slice(1);
      const dayAddons = orderDetails.addOns[dayKey] || [];

      // Create the extras string if there are addons
      const extrasString = dayAddons.length > 0
        ? dayAddons.map(addon => `${addon.name} ${addon.quantity} $${addon.price}`).join(', ')
        : '';

      // Find the matching record in Airtable
      const records = await base('Orders').select({
        filterByFormula: `AND(
          {Customer Name} = '${customerInfo.name}',
          {Day} = '${order.day}',
          {Status} = 'Pending Pick Up'
        )`
      }).firstPage();

      if (records.length > 0) {
        // Update the Airtable record with the extras string
        await base('Orders').update(records[0].id, {
          "Extras": extrasString
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Extras updated successfully"
      })
    };

  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        message: "Failed to update extras"
      })
    };
  }
};


// // update-addon.js
// const Airtable = require('airtable');
// require('dotenv').config();

// exports.handler = async (event, context) => {
//   if (event.httpMethod !== 'POST') {
//     return { statusCode: 405, body: 'Method Not Allowed' };
//   }

//   const base = new Airtable({
//     apiKey: process.env.AIRTABLE_API_KEY
//   }).base(process.env.AIRTABLE_BASE_ID);

//   try {
//     // Log incoming data for debugging
//     console.log('Received data:', event.body);
    
//     const data = JSON.parse(event.body);
//     const { customerInfo, orderDetails } = data;

//     // Update Airtable records
//     for (const order of orderDetails.orders) {
//       const dayKey = order.day.charAt(0).toUpperCase() + order.day.slice(1);
//       const dayAddons = orderDetails.addOns[dayKey] || [];
      
//       // Format extras string only if there are addons for this day
//       const extrasString = dayAddons.length > 0 
//         ? dayAddons.map(addon => `${addon.name} ${addon.quantity} $${addon.price}`).join(', ')
//         : '';

//       // Find matching record in Airtable
//       const records = await base('Orders').select({
//         filterByFormula: `AND(
//           {Customer Name} = '${customerInfo.name}',
//           {Day} = '${order.day}',
//           {Status} = 'Pending Pick Up'
//         )`
//       }).firstPage();

//       // Update record if found
//       if (records.length > 0) {
//         await base('Orders').update(records[0].id, {
//           "Extras": extrasString
//         });
//       }
//     }

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         success: true,
//         message: "Extras updated successfully"
//       })
//     };

//   } catch (error) {
//     console.error('Error processing request:', error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ 
//         error: error.message,
//         message: "Failed to update extras" 
//       })
//     };
//   }
// };
