// PA-API v5 版：キーワード検索 → 複数ページ → セールっぽいものを抽出
const fs = require('fs');
const paapi = require('paapi5-nodejs-sdk');

try { require('dotenv').config(); } catch (_) {}

const config = new paapi.Configuration({
  accessKey: process.env.AMAZON_ACCESS_KEY,
  secretKey: process.env.AMAZON_SECRET_KEY,
  host: 'webservices.amazon.co.jp', // JP エンドポイント
  region: 'us-west-2'               // JP は us-west-2 固定
});

const api = new paapi.DefaultApi(config);

// 取得したいフィールド
const resources = [
  'Images.Primary.Medium',
  'ItemInfo.Title',
  'Offers.Listings.Price',
  'Offers.Listings.SavingBasis',
  'Offers.Summaries.LowestPrice'
];

function toItem(x) {
  const title = x?.ItemInfo?.Title?.DisplayValue || '';
  const image = x?.Images?.Primary?.Medium?.URL || '';
  const url   = x?.DetailPageURL || '';
  const listing = x?.Offers?.Listings?.[0];
  const oldPrice = listing?.SavingBasis?.DisplayAmount || '';  // 定価（比較基準）
  const salePrice = listing?.Price?.DisplayAmount || (x?.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount || '');
  return { title, image, url, oldPrice, salePrice };
}

(async () => {
  try {
    const keywords = 'コミック OR 小説 OR ライトノベル OR ビジネス OR Kindle';
    let all = [];

    // 1〜5ページ分取得（必要なら 10 まで増やせます）
    for (let page = 1; page <= 5; page++) {
      console.log(`🛰 Fetching page ${page}...`);
      const req = new paapi.SearchItemsRequest();
      req['PartnerTag']   = process.env.AMAZON_ASSOCIATE_TAG; // 例: xxxx-22
      req['PartnerType']  = 'Associates';
      req['Marketplace']  = 'www.amazon.co.jp';
      req['Keywords']     = keywords;
      req['ItemPage']     = page;
      req['Resources']    = resources;

      try {
        const res = await api.searchItems(req);
        const items = res?.SearchResult?.Items || [];
        all = all.concat(items);
      } catch (e) {
        // v5 のエラーはオブジェクトが深いことがあるので安全に文字列化
        const msg = e?.response?.text ? await e.response.text() : (e?.message || JSON.stringify(e));
        console.error(`❌ page ${page} error:`, msg);
      }
    }

    console.log('取得件数(生データ):', all.length);

    // セールらしさ：定価(SavingBasis)と現在価格が両方あり、違うもの
    const data = all
      .map(toItem)
      .filter(b => b.title && b.salePrice && b.oldPrice && b.oldPrice !== b.salePrice)
      .slice(0, 50); // 出力を最大50件に制限

    console.log('抽出件数(セール品):', data.length);

    fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
    console.log('✅ kindle-sale.json を作成しました！');
  } catch (err) {
    const msg = err?.message || JSON.stringify(err);
    console.error('❌ fatal:', msg);
    fs.writeFileSync('kindle-sale.json', JSON.stringify([], null, 2));
    process.exit(1);
  }
})();
