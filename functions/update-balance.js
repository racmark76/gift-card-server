const Airtable = require('airtable');
exports.handler = async (event) => {
 // Add CORS headers
 const headers = {
   'Access-Control-Allow-Origin': 'https://sorianobrotherscubancuisine.com', 
   'Access-Control-Allow-Headers': 'Content-Type',
   'Access-Control-Allow-Methods': 'POST, OPTIONS'
 };

 // Handle preflight requests
 if (event.httpMethod === 'OPTIONS') {
   return {
     statusCode: 200,
     headers,
     body: ''
   };
 }

 if (event.httpMethod !== 'POST') {
   return {
     statusCode: 405,
     headers,
     body: JSON.stringify({ error: 'Method Not Allowed' })
   };
 }

 try {
   const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
     .base(process.env.AIRTABLE_BASE_ID);
   
   console.log('Attempting to parse:', event.body);
   const { giftCardCode, amount } = JSON.parse(event.body);
   console.log('Gift code:', giftCardCode);
   console.log('Amount:', amount);
   
   const records = await base('Gift Cards')
     .select({
       filterByFormula: `{Gift Code} = '${giftCardCode}'`
     })
     .firstPage();
   
   if (!records.length) {
     return {
       statusCode: 404,
       headers,
       body: JSON.stringify({ error: 'Gift card not found' })
     };
   }

   const record = records[0];
   const currentBalance = parseFloat(record.get('Current Balance'));

   // Calculate amounts correctly
   let amountToDeduct = 0;
   let remainingToPay = amount;

   if (currentBalance >= amount) {
       // Can cover full amount
       amountToDeduct = amount;
       remainingToPay = 0;
   } else {
       // Can only cover partial amount
       amountToDeduct = currentBalance;  // Only use what's available
       remainingToPay = parseFloat((amount - currentBalance).toFixed(2));  // Customer pays the difference
   }

   const newBalance = parseFloat((currentBalance - amountToDeduct).toFixed(2));
   const currentDate = new Date().toISOString();

   await base('Gift Cards').update(record.id, {
     'Current Balance': newBalance,
     'Status': newBalance <= 0 ? 'Depleted' : 'Active',
     'Last Used Date': currentDate
   });

   return {
     statusCode: 200,
     headers,
     body: JSON.stringify({ 
       success: true,
       newBalance,
       amountDeducted: amountToDeduct,
       remainingToPay,
       status: newBalance <= 0 ? 'Depleted' : 'Active',
       lastUsed: currentDate
     })
   };

 } catch (error) {
   console.error('Error details:', error.message, error.stack);
   return {
     statusCode: 500,
     headers,
     body: JSON.stringify({ 
       error: 'Server error',
       details: error.message 
     })
   };
 }
};

// const Airtable = require('airtable');

// exports.handler = async (event) => {
//   // Add CORS headers
//   const headers = {
//     'Access-Control-Allow-Origin': 'https://sorianobrotherscubancuisine.com',
//     'Access-Control-Allow-Headers': 'Content-Type',
//     'Access-Control-Allow-Methods': 'POST, OPTIONS'
//   };

//   // Handle preflight requests
//   if (event.httpMethod === 'OPTIONS') {
//     return {
//       statusCode: 200,
//       headers,
//       body: ''
//     };
//   }

//   if (event.httpMethod !== 'POST') {
//     return {
//       statusCode: 405,
//       headers,
//       body: JSON.stringify({ error: 'Method Not Allowed' })
//     };
//   }

//   try {
//     const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
//       .base(process.env.AIRTABLE_BASE_ID);
    
//     console.log('Attempting to parse:', event.body);
//     const { giftCardCode, amount } = JSON.parse(event.body);  // Updated to match frontend parameter names
//     console.log('Gift code:', giftCardCode);
//     console.log('Amount:', amount);
    
//     const records = await base('Gift Cards')
//       .select({
//         filterByFormula: `{Gift Code} = '${giftCardCode}'`  // Make sure this matches your Airtable column name
//       })
//       .firstPage();
    
//     if (!records.length) {
//       return {
//         statusCode: 404,
//         headers,
//         body: JSON.stringify({ error: 'Gift card not found' })
//       };
//     }

//     const record = records[0];
//     const currentBalance = parseFloat(record.get('Current Balance'));
    
//     if (currentBalance < amount) {
//       return {
//         statusCode: 400,
//         headers,
//         body: JSON.stringify({
//           error: 'Insufficient balance',
//           available: currentBalance,
//           requested: amount
//         })
//       };
//     }

//     const newBalance = currentBalance - amount;
//     const currentDate = new Date().toISOString();

//     await base('Gift Cards').update(record.id, {
//       'Current Balance': newBalance,
//       'Status': newBalance <= 0 ? 'Depleted' : 'Active',
//       'Last Used Date': currentDate
//     });

//     return {
//       statusCode: 200,
//       headers,
//       body: JSON.stringify({ 
//         success: true,
//         newBalance,
//         amount,  // Added to match frontend expectations
//         status: newBalance <= 0 ? 'Depleted' : 'Active',
//         lastUsed: currentDate
//       })
//     };
//   } catch (error) {
//     console.error('Error details:', error.message, error.stack);
//     return {
//       statusCode: 500,
//       headers,
//       body: JSON.stringify({ 
//         error: 'Server error',
//         details: error.message 
//       })
//     };
//   }
// };

