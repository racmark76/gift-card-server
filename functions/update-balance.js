// const Airtable = require('airtable');

// exports.handler = async (event) => {
//   console.log('Request body:', event.body);
  
//   if (event.httpMethod !== 'POST') {
//     return { statusCode: 405, body: 'Method Not Allowed' };
//   }

//   try {
//     const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
//       .base(process.env.AIRTABLE_BASE_ID);
    
//     console.log('Attempting to parse:', event.body);
//     const { giftCode, amountToCharge } = JSON.parse(event.body);
//     console.log('Gift code:', giftCode);
//     console.log('Amount:', amountToCharge);
    
//     const records = await base('Gift Cards')
//       .select({
//         filterByFormula: `{Gift Code} = '${giftCode}'`
//       })
//       .firstPage();
    
//     if (!records.length) {
//       return {
//         statusCode: 404,
//         body: JSON.stringify({ error: 'Gift card not found' })
//       };
//     }

//     const record = records[0];
//     const currentBalance = parseFloat(record.get('Current Balance'));
    
//     if (currentBalance < amountToCharge) {
//       return {
//         statusCode: 400,
//         body: JSON.stringify({
//           error: 'Insufficient balance',
//           available: currentBalance,
//           requested: amountToCharge
//         })
//       };
//     }

//     const newBalance = currentBalance - amountToCharge;

//     await base('Gift Cards').update(record.id, {
//       'Current Balance': newBalance,
//       'Status': newBalance <= 0 ? 'Depleted' : 'Active'
//   
//     });

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ 
//         success: true,
//         newBalance,
//         status: newBalance <= 0 ? 'Depleted' : 'Active'
//       })
//     };

//   } catch (error) {
//     console.error('Error details:', error.message, error.stack);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ 
//         error: 'Server error',
//         details: error.message 
//       })
//     };
//   }
// };

const Airtable = require('airtable');

exports.handler = async (event) => {
  console.log('Request body:', event.body);
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
      .base(process.env.AIRTABLE_BASE_ID);
    
    console.log('Attempting to parse:', event.body);
    const { giftCode, amountToCharge } = JSON.parse(event.body);
    console.log('Gift code:', giftCode);
    console.log('Amount:', amountToCharge);
    
    const records = await base('Gift Cards')
      .select({
        filterByFormula: `{Gift Code} = '${giftCode}'`
      })
      .firstPage();
    
    if (!records.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Gift card not found' })
      };
    }

    const record = records[0];
    const currentBalance = parseFloat(record.get('Current Balance'));
    
    if (currentBalance < amountToCharge) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Insufficient balance',
          available: currentBalance,
          requested: amountToCharge
        })
      };
    }

    const newBalance = currentBalance - amountToCharge;

    await base('Gift Cards').update(record.id, {
      'Current Balance': newBalance,
      'Status': newBalance <= 0 ? 'Depleted' : 'Active',
     
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        newBalance,
        status: newBalance <= 0 ? 'Depleted' : 'Active',
        lastUsed: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error details:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Server error',
        details: error.message 
      })
    };
  }
};
