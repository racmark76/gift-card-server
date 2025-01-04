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

  try {
    // First get recent records from Airtable
    console.log('Getting recent records...');
    const records = await base('tblM6K7Ii11HBkrW9').select({
      maxRecords: 10,
      sort: [{field: 'Week', direction: 'desc'}]
    }).all();

    // Log what we found
    console.log('Found records:');
    records.forEach(record => {
      console.log({
        id: record.id,
        customer: record.get('Customer Name'),
        week: record.get('Week'),
        day: record.get('Day'),
        extras: record.get('Extras')
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        records: records.map(record => ({
          customer: record.get('Customer Name'),
          week: record.get('Week'),
          day: record.get('Day')
        }))
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};



// const Airtable = require('airtable');
// exports.handler = async (event) => {
//  const headers = {
//    'Access-Control-Allow-Origin': 'https://sorianobrotherscubancuisine.com', 
//    'Access-Control-Allow-Headers': 'Content-Type',
//    'Access-Control-Allow-Methods': 'POST, OPTIONS'
//  };

//  if (event.httpMethod === 'OPTIONS') {
//    return {
//      statusCode: 200,
//      headers,
//      body: ''
//    };
//  }

//  if (event.httpMethod !== 'POST') {
//    return {
//      statusCode: 405,
//      headers,
//      body: JSON.stringify({ error: 'Method Not Allowed' })
//    };
//  }

//  try {
//    const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY})
//      .base(process.env.AIRTABLE_BASE_ID);
   
//    const { giftCardCode, amount, checkBalance } = JSON.parse(event.body);
//    console.log('Gift code:', giftCardCode);
//    console.log('Amount:', amount);
//    console.log('Check Balance Only:', checkBalance);
   
//    const records = await base('Gift Cards')
//      .select({
//        filterByFormula: `{Gift Code} = '${giftCardCode}'`
//      })
//      .firstPage();
   
//    if (!records.length) {
//      return {
//        statusCode: 404,
//        headers,
//        body: JSON.stringify({ error: 'Gift card not found' })
//      };
//    }

//    const record = records[0];
//    const currentBalance = parseFloat(record.get('Current Balance'));

//    // If only checking balance, return current balance without updating
//    if (checkBalance) {
//      return {
//        statusCode: 200,
//        headers,
//        body: JSON.stringify({ 
//          success: true,
//          currentBalance,
//          status: currentBalance <= 0 ? 'Depleted' : 'Active'
//        })
//      };
//    }

//    // Otherwise, proceed with deduction
//    let amountToDeduct = 0;
//    let remainingToPay = amount;

//    if (currentBalance >= amount) {
//        amountToDeduct = amount;
//        remainingToPay = 0;
//    } else {
//        amountToDeduct = currentBalance;
//        remainingToPay = parseFloat((amount - currentBalance).toFixed(2));
//    }

//    const newBalance = parseFloat((currentBalance - amountToDeduct).toFixed(2));
//    const currentDate = new Date().toISOString();

//    await base('Gift Cards').update(record.id, {
//      'Current Balance': newBalance,
//      'Status': newBalance <= 0 ? 'Depleted' : 'Active',
//      'Last Used Date': currentDate
//    });

//    return {
//      statusCode: 200,
//      headers,
//      body: JSON.stringify({ 
//        success: true,
//        newBalance,
//        amountDeducted: amountToDeduct,
//        remainingToPay,
//        status: newBalance <= 0 ? 'Depleted' : 'Active',
//        lastUsed: currentDate
//      })
//    };

//  } catch (error) {
//    console.error('Error details:', error.message, error.stack);
//    return {
//      statusCode: 500,
//      headers,
//      body: JSON.stringify({ 
//        error: 'Server error',
//        details: error.message 
//      })
//    };
//  }
// };




