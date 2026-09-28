# Rogue of Arcadia(ローグ・オブ・アルカディア)

ドット絵風のリアルタイム・ローグライクRPG。ブラウザだけで動作し、ビルド不要です。

- 自動生成される広大なダンジョン(部屋+通路、最小全域木で自然に接続)
- 左スティックで移動、右スティックで狙った方向へ斬りつける2スティック操作(PCは矢印キー/WASD+Space)
- ゴブリン・ネズミ・コウモリ・スケルトンなど、階層が深くなるほど増える敵の種類
- 薬草・剣のかけら・盾のかけら・お守りなど、拾って使う/自動装備するアイテム
- ノックバック、斬撃エフェクト、敵の死亡フェードなどのリアルタイム演出
- iPad含むタッチ端末の画面サイズにフィットするレイアウト

## 遊び方

`index.html` をブラウザで開くだけで遊べます。ローカルサーバーも不要です。

## GitHub Pagesで公開する

推奨リポジトリ名: `rogue-of-arcadia`

1. GitHubで `rogue-of-arcadia` という名前のリポジトリを作成し、このフォルダの中身(`index.html` / `game.js` / `README.md`)をルートに置いてpush
2. リポジトリの Settings → Pages で、公開ブランチを `main`、フォルダを `/ (root)` に指定
3. 数分後に以下のURLで公開される

```
https://<あなたのGitHubユーザー名>.github.io/rogue-of-arcadia/
```

独自ドメインを使いたい場合は、同じPages設定画面の「Custom domain」から設定できます。

## GitHubのユーザー名を出さずに公開する(Netlify / Vercel)

`github.io/<ユーザー名>/...` のURLではなく、独立したゲームらしい短いURLにしたい場合は、同じリポジトリをNetlifyかVercelにデプロイするのがおすすめです(どちらも無料)。

1. GitHubにリポジトリをpushしておく
2. [Netlify](https://www.netlify.com) または [Vercel](https://vercel.com) にGitHubアカウントでログインし、`rogue-of-arcadia` リポジトリを選んで「Deploy」
3. サイト名(サブドメイン)を `rogue-of-arcadia` に設定すると、以下のようなURLになる

```
https://rogue-of-arcadia.netlify.app
```
```
https://rogue-of-arcadia.vercel.app
```

独自ドメイン(例: `roguearcadia.com`)を取得すれば、どちらのサービスでも無料で紐付けられます。

## ファイル構成

```
index.html          ページ本体・スタイル(<style>内)
js/
  constants.js       画面サイズ・配色・敵ステータス表などの定数
  utils.js           乱数・ハッシュなどの汎用ヘルパー
  ui.js              HUD・アイテム欄・メッセージログ
  sprites.js         プレイヤー・敵のドット絵パーツ描画
  render.js          カメラ・タイル・エフェクトの描画処理
  dungeon.js         ダンジョンの自動生成(部屋・通路・敵・アイテム配置)
  town.js            拠点の街アルカディア(街並み・NPC・生き物・会話)
  combat.js          当たり判定・移動・攻撃・毎フレームの更新処理
  input.js           キーボード操作・左右スティック入力
  main.js            初期化・ゲームループ・起動処理(読み込みは必ず最後)
```

`index.html` は上から順に `js/` 内のファイルを `<script>` タグで読み込んでいます。ビルド不要・ES Modules不使用のプレーンな構成なので、`index.html` をブラウザで開くだけでそのまま動作します。ファイルを追加・分割する場合は、`main.js` が一番最後に読み込まれる位置を保ってください(ゲームの初期化はここで行っています)。

## 今後の拡張アイデア

- ボス敵、装備の見た目反映、ミニマップ、BGM/効果音の追加など
