require('dotenv').config();

const fs = require('fs');
const amazon = require('amazon-product-api');

const client = amazon.createClient({
  awsId: process.env.AMAZON_ACCESS_KEY,
  awsSecret: process.env.AMAZON_SECRET_KEY,
  awsTag: process.env.AMAZON_ASSOCIATE_TAG
});

(async () => {
  try {
    console.log("Amazon API から取得中…");
    const results = await client.itemSearch({
      keywords: 'Kindle',
      searchIndex: 'KindleStore',
      responseGroup: 'ItemAttributes,Offers,Images'
    });

    console.log("取得件数:", results.length);

    const data = results.map(item => ({
      title: item?.ItemAttributes?.[0]?.Title?.[0] || '',
      image: item?.LargeImage?.[0]?.URL?.[0] || '',
      url: (item?.DetailPageURL?.[0] || '') + (process.env.AMAZON_ASSOCIATE_TAG ? `?tag=${process.env.AMAZON_ASSOCIATE_TAG}` : ''),
      oldPrice: item?.ItemAttributes?.[0]?.ListPrice?.[0]?.FormattedPrice?.[0] || 'N/A',
      salePrice: item?.OfferSummary?.[0]?.LowestNewPrice?.[0]?.FormattedPrice?.[0] || 'N/A'
    }));

    fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
    console.log("✅ kindle-sale.json を作成しました！");
  } catch (err) {
    console.error("❌ Amazon API error:", err);
    // エラーでも空配列でファイルは残す（git add のため）
    fs.writeFileSync('kindle-sale.json', JSON.stringify([], null, 2));
  }
})();
