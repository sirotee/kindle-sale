const fs = require('fs');
const AmazonPaapi = require('amazon-paapi');

const client = new AmazonPaapi.AmazonPaapi({
  accessKey: 'AKPA0A3DFU1756557189',
  secretKey: 'OdYhCNLoIfEk8HkAyQTpvkM+EoIBsIRfAi6KMQrB',
  partnerTag: 'amazon-2022-22',
  region: 'JP'
});

(async () => {
  const res = await client.searchItems({
    keywords: 'Kindle セール',
    searchIndex: 'KindleStore',
    itemCount: 10,
    sortBy: 'Price:LowToHigh'
  });

  const data = res.itemsResult.items.map(item => ({
    title: item.itemInfo.title.displayValue,
    image: item.images.primary.medium.url,
    url: `${item.detailPageURL}?tag=amazon-2022-22`,
    oldPrice: item.offers?.listings?.[0]?.price?.displayAmount || 'N/A',
    salePrice: item.offers?.listings?.[0]?.savingBasis?.displayAmount || item.offers?.listings?.[0]?.price?.displayAmount || 'N/A'
  }));

  fs.writeFileSync('kindle-sale.json', JSON.stringify(data, null, 2));
})();
