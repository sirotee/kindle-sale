const fs = require('fs');
const paapi = require('paapi5-nodejs-sdk');

try { require('dotenv').config(); } catch (_) {}

const defaultClient = paapi.ApiClient.instance;

// 認証情報をセット
defaultClient.accessKey = process.env.AMAZON_ACCESS_KEY;
defaultClient.secretKey = process.env.AMAZON_SECRET_KEY;

// エンドポイント設定（日本）
defaultClient.host = "webservices.amazon.co.jp";
defaultClient.region = "us-west-2";

const api = new paapi.DefaultApi();

// 取得する情報の種類
const resources = [
  "Images.Primary.Medium",
  "ItemInfo.Title",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "Offers.Summaries.LowestPrice"
];

function toItem(x) {
  const title = x?.ItemInfo?.Title?.DisplayValue || "";
  const image = x?.Images?.Primary?.Medium?.URL || "";
  const url   = x?.DetailPageURL || "";
  const listing = x?.Offers?.Listings?.[0];
  const oldPrice = listing?.SavingBasis?.DisplayAmount || "";
  const salePrice = listing?.Price?.DisplayAmount ||
                   (x?.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount || "");
  return { title, image, url, oldPrice, salePrice };
}

(async () => {
  try {
    const keywords = "Kindle セール";
    let all = [];

    for (let page = 1; page <= 5; page++) {
      console.log(`🛰 Fetching page ${page}...`);
      const req = new paapi.SearchItemsRequest();
      req['PartnerTag']   = process.env.AMAZON_ASSOCIATE_TAG; // 例: xxxx-22
      req['PartnerType']  = "Associates";
      req['Marketplace']  = "www.amazon.co.jp";
      req['Keywords']     = keywords;
      req['ItemPage']     = page;
      req['Resources']    = resources;

      try {
        const res = await api.searchItems(req);
        const items = res?.SearchResult?.Items || [];
        all = all.concat(items);
      } catch (e) {
        const msg = e?.response?.text ? await e.response.text() : (e?.message || JSON.stringify(e));
        console.error(`❌ page ${page} error:`, msg);
      }
    }

    console.log("取得件数(生データ):", all.length);

    const data = all
      .map(toItem)
      .filter(b => b.title && b.salePrice && b.oldPrice && b.oldPrice !== b.salePrice)
      .slice(0, 50);

    console.log("抽出件数(セール品):", data.length);

    fs.writeFileSync("kindle-sale.json", JSON.stringify(data, null, 2));
    console.log("✅ kindle-sale.json を作成しました！");
  } catch (err) {
    console.error("❌ fatal:", err?.message || JSON.stringify(err));
    fs.writeFileSync("kindle-sale.json", JSON.stringify([], null, 2));
    process.exit(1);
  }
})();
