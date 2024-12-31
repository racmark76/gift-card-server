const Airtable = require('airtable');
exports.handler = async (event) => {
 const headers = {
   'Access-Control-Allow-Origin': 'https://sorianobrotherscubancuisine.com', 
   'Access-Control-Allow-Headers': 'Content-Type',
   'Access-Control-Allow-Methods': 'POST, OPTIONS'
 };

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
   
   const { giftCardCode, amount, checkBalance } = JSON.parse(event.body);
   console.log('Gift code:', giftCardCode);
   console.log('Amount:', amount);
   console.log('Check Balance Only:', checkBalance);
   
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

   // If only checking balance, return current balance without updating
   if (checkBalance) {
     return {
       statusCode: 200,
       headers,
       body: JSON.stringify({ 
         success: true,
         currentBalance,
         status: currentBalance <= 0 ? 'Depleted' : 'Active'
       })
     };
   }

   // Otherwise, proceed with deduction
   let amountToDeduct = 0;
   let remainingToPay = amount;

   if (currentBalance >= amount) {
       amountToDeduct = amount;
       remainingToPay = 0;
   } else {
       amountToDeduct = currentBalance;
       remainingToPay = parseFloat((amount - currentBalance).toFixed(2));
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




