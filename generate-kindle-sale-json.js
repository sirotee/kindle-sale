const fs = require('fs');
const paapi = require('paapi5-nodejs-sdk');
try { require('dotenv').config(); } catch (_) {}

// ---- PA-API v5 クライアント設定（JP）----
const client = paapi.ApiClient.instance;
client.accessKey = process.env.AMAZON_ACCESS_KEY;
client.secretKey = process.env.AMAZON_SECRET_KEY;
client.host = 'webservices.amazon.co.jp';
client.region = 'us-west-2';
const api = new paapi.DefaultApi();

// 取ってくるフィールド
const RESOURCES = [
  'Images.Primary.Medium',
  'ItemInfo.Title',
  'Offers.Listings.Price',
  'Offers.Listings.SavingBasis',
  'Offers.Summaries.LowestPrice'
];

// セールを拾いやすいように複数キーワードで当てる
const KEYWORDS = [
  'コミック', '小説', 'ビジネス', 'ライトノベル', '実用', 'マンガ',
];

function toItem(x){
  const title = x?.ItemInfo?.Title?.DisplayValue || '';
  const image = x?.Images?.Primary?.Medium?.URL || '';
  const url   = x?.DetailPageURL || '';
  const listing = x?.Offers?.Listings?.[0];
  const oldPrice  = listing?.SavingBasis?.DisplayAmount || '';
  const salePrice = listing?.Price?.DisplayAmount
                 || x?.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount || '';
  return { title, image, url, oldPrice, salePrice };
}

(async () => {
  let all = [];
  try {
    for (const kw of KEYWORDS) {
      for (let page = 1; page <= 5; page++) {
        const req = new paapi.SearchItemsRequest();
        req['PartnerTag']  = process.env.AMAZON_ASSOCIATE_TAG; // 例: yourtag-22
        req['PartnerType'] = 'Associates';
        req['Marketplace'] = 'www.amazon.co.jp';
        req['SearchIndex'] = 'KindleStore';      // ← 重要：明示する
        req['Keywords']    = kw;
        req['ItemPage']    = page;
        req['ItemCount']   = 10;
        req['MinSavingPercent'] = 5;             // ← 割引5%以上
        req['Resources']   = RESOURCES;

        try {
          const res = await api.searchItems(req);
          const items = res?.SearchResult?.Items || [];
          all = all.concat(items);
        } catch (e) {
          const msg = e?.response?.text ? await e.response.text() : (e?.message || JSON.stringify(e));
          console.error(`❌ kw="${kw}" page=${page} error:`, msg);
        }
      }
    }

    console.log('取得件数(生データ):', all.length);

    const data = all
      .map(toItem)
      .filter(b => b.title && b.salePrice && b.oldPrice && b.oldPrice !== b.salePrice)
      // 重複URLを排除
      .filter((v, i, arr) => arr.findIndex(x => x.url === v.url) === i)
      .slice(0, 50);

    console.log('抽出件数(セール品):', data.length);
    fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
    console.log('✅ kindle-sale.json を作成しました！');
  } catch (err) {
    console.error('❌ fatal:', err?.message || JSON.stringify(err));
    fs.writeFileSync('kindle-sale.json', JSON.stringify([], null, 2));
    process.exit(1);
  }
})();
