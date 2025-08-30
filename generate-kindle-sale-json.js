const fs = require('fs');
const amazon = require('amazon-product-api');

const client = amazon.createClient({
  awsId: process.env.AMAZON_ACCESS_KEY,
  awsSecret: process.env.AMAZON_SECRET_KEY,
  awsTag: process.env.AMAZON_ASSOCIATE_TAG  // ← 固定文字列ではなく環境変数に直そう！
});

client.itemSearch({
  keywords: 'Kindle',
  searchIndex: 'KindleStore',
  responseGroup: 'ItemAttributes,Offers,Images',
  sort: 'price'
}).then(function(results){
  console.log("取得件数:", results.length); // ← ここが重要！

  const data = results.map(item => ({
    title: item.ItemAttributes[0].Title[0],
    image: item.LargeImage?.[0]?.URL?.[0] || '',
    url: item.DetailPageURL[0],
    oldPrice: item.ItemAttributes[0].ListPrice?.[0]?.FormattedPrice?.[0] || 'N/A',
    salePrice: item.OfferSummary?.[0]?.LowestNewPrice?.[0]?.FormattedPrice?.[0] || 'N/A'
  }));

  fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
  console.log("✅ kindle-sale.json を作成しました！");
}).catch(function(err){
  console.error("❌ Amazon API error:", err);
});
