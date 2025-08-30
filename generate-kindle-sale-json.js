const fs = require('fs');
const amazon = require('amazon-product-api');

const client = amazon.createClient({
  awsId: process.env.AMAZON_ACCESS_KEY,
  awsSecret: process.env.AMAZON_SECRET_KEY,
  awsTag: process.env.AMAZON_ASSOCIATE_TAG
});

(async () => {
  try {
    let all = [];

    // 1〜5ページ分まとめて取る（最大50件程度）
    for (let page = 1; page <= 5; page++) {
      console.log(`📡 Fetching page ${page}...`);
      const res = await client.itemSearch({
        keywords: 'Kindle',
        searchIndex: 'KindleStore',
        responseGroup: 'ItemAttributes,Offers,Images',
        itemPage: page
      });
      all = all.concat(res);
    }

    console.log("取得件数 (生データ):", all.length);

    // セール品だけに絞り込み
    const data = all
      .map(item => {
        const oldP = item.ItemAttributes?.[0]?.ListPrice?.[0]?.FormattedPrice?.[0] || '';
        const saleP = item.OfferSummary?.[0]?.LowestNewPrice?.[0]?.FormattedPrice?.[0] || '';
        return {
          title: item.ItemAttributes?.[0]?.Title?.[0] || '',
          image: item.LargeImage?.[0]?.URL?.[0] || '',
          url: item.DetailPageURL?.[0] || '',
          oldPrice: oldP,
          salePrice: saleP
        };
      })
      .filter(b => b.oldPrice && b.salePrice && b.oldPrice !== b.salePrice);

    console.log("抽出件数 (セール品):", data.length);

    fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
    console.log("✅ kindle-sale.json を作成しました！");
  } catch (err) {
    console.error("❌ Amazon API error:", err);
    process.exit(1);
  }
})();
