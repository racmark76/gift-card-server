// update-addon.js
const Airtable = require('airtable');

exports.handler = async (event, context) => {
  try {
    // Configure Airtable
    const base = new Airtable({apiKey: 'YOUR_API_KEY'}).base('YOUR_BASE_ID');
    
    const data = JSON.parse(event.body);
    const { orderDetails } = data;
    
    // Process orders and update Airtable
    const processedOrders = await Promise.all(orderDetails.orders.map(async order => {
      const dayAddons = orderDetails.addOns[order.day.charAt(0).toUpperCase() + order.day.slice(1)] || [];
      
      // Create Airtable record
      await base('Orders').create({
        "Customer Name": data.customerInfo.name,
        "Day": order.day,
        "Main Dish": order.name,
        "Extras": dayAddons.length > 0 ? 
          dayAddons.map(addon => `${addon.name} - ${addon.quantity} - $${addon.price}`).join(', ') 
          : '',
        "Status": "Pending Pick Up"
      });

      return {
        ...order,
        extras: dayAddons
      };
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Orders processed and Airtable updated"
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
