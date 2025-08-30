const fs = require('fs');
const amazon = require('amazon-product-api');

// 必要に応じて dotenv（ローカル実行用）
// GitHub Actions では env で渡しているので無くてもOK
try { require('dotenv').config(); } catch (_) {}

const client = amazon.createClient({
  awsId: process.env.AMAZON_ACCESS_KEY,
  awsSecret: process.env.AMAZON_SECRET_KEY,
  awsTag: process.env.AMAZON_ASSOCIATE_TAG,
  // 日本向けエンドポイント指定（これ重要）
  host: 'webservices.amazon.co.jp',
  region: 'JP'
});

// amazon-product-api のエラーは配列＆深いネストになることがある
function readApiError(err) {
  try {
    // 典型: err[0].Error[0].Message[0]
    const msg =
      (err && err[0] && err[0].Error && err[0].Error[0] && err[0].Error[0].Message && err[0].Error[0].Message[0]) ||
      (err && err.message) ||
      JSON.stringify(err);
    return msg;
  } catch (_) {
    return String(err);
  }
}

(async () => {
  let all = [];
  try {
    // 1〜5ページをトライ。ページ単位で失敗しても継続
    for (let page = 1; page <= 5; page++) {
      console.log(`🛰 Fetching page ${page}...`);
      try {
        const res = await client.itemSearch({
          keywords: 'Kindle',
          searchIndex: 'KindleStore',
          responseGroup: 'ItemAttributes,Offers,Images',
          itemPage: page
        });
        all = all.concat(res || []);
      } catch (e) {
        console.error(`❌ Page ${page} error:`, readApiError(e));
        // 次のページに進む
      }
    }

    console.log('取得件数(生データ):', all.length);

    // セールっぽいものに絞る（定価と現在価格が違う）
    const data = (all || [])
      .map(item => {
        const title = item?.ItemAttributes?.[0]?.Title?.[0] || '';
        const image = item?.LargeImage?.[0]?.URL?.[0] || '';
        const url = (item?.DetailPageURL?.[0] || '');
        const oldPrice = item?.ItemAttributes?.[0]?.ListPrice?.[0]?.FormattedPrice?.[0] || '';
        const salePrice = item?.OfferSummary?.[0]?.LowestNewPrice?.[0]?.FormattedPrice?.[0] || '';
        return { title, image, url, oldPrice, salePrice };
      })
      .filter(b => b.title && b.oldPrice && b.salePrice && b.oldPrice !== b.salePrice);

    console.log('抽出件数(セール品):', data.length);

    // 空でもファイルは必ず書く（フロントで表示できるように）
    fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
    console.log('✅ kindle-sale.json を作成しました！');
  } catch (err) {
    console.error('❌ Amazon API fatal error:', readApiError(err));
    // 何があっても空配列を書き出して終了（git add がコケないように）
    try { fs.writeFileSync('kindle-sale.json', JSON.stringify([], null, 2)); } catch (_) {}
    process.exit(1);
  }
})();
