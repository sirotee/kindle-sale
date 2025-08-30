const fs = require('fs');
const amazon = require('amazon-product-api');

const client = amazon.createClient({
  awsId: process.env.AMAZON_ACCESS_KEY,
  awsSecret: process.env.AMAZON_SECRET_KEY,
  awsTag: 'amazon-2022-22'
});

client.itemSearch({
  keywords: 'Kindle',
  searchIndex: 'KindleStore',
  responseGroup: 'ItemAttributes,Offers,Images',
  sort: 'price'
}).then(function(results){
  const data = results.map(item => ({
    title: item.ItemAttributes[0].Title[0],
    image: item.LargeImage?.[0]?.URL?.[0] || '',
    url: item.DetailPageURL[0],
    oldPrice: item.ItemAttributes[0].ListPrice?.[0]?.FormattedPrice?.[0] || 'N/A',
    salePrice: item.OfferSummary?.[0]?.LowestNewPrice?.[0]?.FormattedPrice?.[0] || 'N/A'
  }));
  fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
}).catch(function(err){
  console.error("Amazon API error:", err);
});
