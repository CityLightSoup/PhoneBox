# Payphone Portal

公衆電話に3桁の番号をかけて、制作物のページへ移動するポータルサイト。
Vite + React + React Router + React Three Fiber。設計は `公衆電話ポータルサイト設計メモ.md` を参照。

## はじめかた

```bash
npm install
# 公衆電話のglbを置く（下の「モデル」を参照）
npm run dev
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 型チェック + 本番ビルド（`dist/`） |
| `npm run typecheck` | 型チェックのみ |
| `npm test` | ダイヤルの規則・カメラ位置の計算のテスト |

## モデル

`public/models/` に置く。**公衆電話のglbがないと起動時にエラー画面になる**（原因を画面に出す）。

1. `phone_test.glb` を meshopt で圧縮して `public/models/phone.glb` にする

   ```bash
   npx @gltf-transform/cli optimize phone_test.glb public/models/phone.glb --compress meshopt
   ```

   圧縮後に、コードの変形（受話器を取る間の蛇腹）が正しく動くか確認する。
2. 電話ボックスは、glbができるまでコードで作った仮のモデルが出る。できたら `public/models/booth.glb` に置き、`src/config.ts` の `USE_BOOTH_GLB` を `true` にする。
   書き出しの約束事（設計メモの「電話ボックスのモデル」）: 公衆電話と同じ座標系・同じ倍率、折れ戸の原点は蝶番、クリップ名は `DoorOpen`（`BOOTH_DOOR_CLIP`）。

## 設定

調整する値は `src/config.ts` に集めてある。

- 内部解像度の高さ（`RES_H`、まず 360。幅は画面の縦横比に合わせる）、拡大率を整数にするか（`INTEGER_SCALE`）
- マテリアルの置き換え先（`MATERIAL_MODE`: `lambert` / `toon`）
- ダイヤルの待ち時間（`DIAL_COMMIT_MS` など）、「Calling...」の最低表示時間（`RING_MIN_MS`）
- カメラ演出（引きの視点、ドアの手前の位置、各区間の時間）
- ライトの強さは `src/portal/Scene.tsx`
- 色とフォントは `src/styles.css`（先頭の変数）

## 作品を足す

1. `src/works/<slug>/index.tsx` を作る（default export のReactコンポーネント。Canvasは作品ごとに持つ）
2. `src/works/registry.ts` に `{ number, slug, title, load }` を1行足す。番号は3桁で重複不可（開発中は不正を `console.error` で知らせる）

`src/works/demo-a`（R3F）と `demo-b`（DOMのみ）はサンプル。番号 `111` / `222` はダミー。`src/works/demo`（番号 `001`）はデモ用の簡単なページ。

## 構成

```
src/
  routes/PortalRoute.tsx      ポータル（Canvas + HUD）。ポータル全体を lazy 読み込み
  routes/WorkRoute.tsx        /works/:slug。作品を lazy 読み込み、常に Hang up で戻れる
  portal/
    Scene.tsx                 ライトと配置（電話機・ボックスは同じ <group scale={0.1}>）
    Payphone.tsx              受話器のアニメーション、ボタンの押し込み、クリック処理
    Booth.tsx                 電話ボックス（glb版 / 仮のモデル）とクリックで入る処理
    CameraRig.tsx / poses.ts  引き → ドアの手前 → POVカメラ の移動
    hooks.ts                  キーボード、発信音、発信（先読みして navigate）
    hud/Hud.tsx               ダイヤル表示、Calling...、NOT IN SERVICE など
    pixel.tsx                 内部解像度を整数倍で表示する仕組み
    retroMaterials.ts         glbのマテリアルを Lambert / Toon に置き換え
  state/portalStore.ts        フェーズとダイヤルの状態（zustand）
  works/registry.ts           番号 → 作品の対応表
  audio/tones.ts              DTMF・発信音・呼出音（Web Audioで合成）
```

## 操作

マウス: ボックス → 電話機 → ボタン。キーボード: `0`-`9` `*` `#` でダイヤル、`Esc` で受話器を置く。

ダイヤルの規則: 3桁そろって1秒操作がなければ発信。1秒以内に数字を押すと破棄して新しい1桁目。`*` で消去。`#` は未使用。
番号が違えば「NOT IN SERVICE」を出して入力を消す。

## Cloudflare Pages

- Build command: `npm run build` / Build output directory: `dist`
- 環境変数 `NODE_VERSION` に `22` など
- `404.html` を置かない（置かなければSPAとして、どのURLにも `index.html` が返る）。デプロイ後に `/works/demo-a` を直接開いて確認する

## 確認済みのこと / まだのこと

確認済み（この環境で実行）: 型チェック、本番ビルド、ダイヤルの規則とカメラ位置の計算のテスト（17件）。

**まだ確認できていない**: ブラウザでの実際の表示と操作。この環境ではWebGLを動かせず、公衆電話のglbも手元にないため。最初に次を見てほしい。

- [ ] 内部解像度（高さ約360）でボタンの数字が読めるか（読めなければ `RES_H` を上げる）
- [ ] ライトの強さ、色味（ステッカー、液晶、コード）
- [ ] 仮のボックスの大きさと、電話機・POVカメラの位置関係
- [ ] 入るときのカメラの動きと、受話器が耳元の正しい位置に来るか
- [ ] クリックの当たり（電話機のどこでも受話器が上がるか、ボタンが押せるか）
- [ ] 作品から戻ったとき、受話器とボタンが元の状態か
