# Kindleセール自動更新サイト

このリポジトリは、AmazonのKindleセール情報を1時間ごとに自動取得し、アフィリエイトリンク付きでHTML表示する静的サイトテンプレートです。

## 使用ライブラリ
- [amazon-product-api](https://www.npmjs.com/package/amazon-product-api)

## 必要な設定

### GitHub Secrets に以下を設定

- `AMAZON_ACCESS_KEY`
- `AMAZON_SECRET_KEY`

## 公開方法

1. GitHubにアップロード
2. Settings → Pages → Source を `main / (root)` にする
3. https://あなたのユーザー名.github.io/kindle-sale/ に公開されます
