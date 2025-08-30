# Kindleセール自動更新サイト

このリポジトリは、AmazonのKindleセール情報を1時間ごとに自動取得し、アフィリエイトリンク付きでHTML表示する静的サイトテンプレートです。

## 必要な設定

### GitHub Secrets に以下を設定（今回はスクリプト内に埋め込み済み）

- `AMAZON_ACCESS_KEY`
- `AMAZON_SECRET_KEY`

## 使用方法

1. GitHubにこのプロジェクトをアップロード
2. GitHub Pagesを有効にする（`index.html`が公開されます）
3. 自動更新は1時間ごとにGitHub Actionsで動作します
