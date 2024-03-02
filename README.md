# serverless-ec-shop

## 手順１

まずは高速化が行われていないシステムをデプロイします。<br>
このシステムはECショップのAPIを提供しており、購入機能、購入履歴の表示機能があります。

![JAWS drawio](https://github.com/seike460/serverless-performance-handson/assets/8141624/25cfbb99-c203-4f46-b3d9-e074684904dd)

今回権限不足によるワークショップの失敗を防ぐ為に、AdministratorAccessをもつIAMを作成します。<br>
本来は最小権限の原則に基づき必要な権限のみ設定するようにしてください。

マネコン上部の検索バーで「IAM」を検索してクリックし、AWS IAMサービスのコンソールに移動します。<br>
IAMコンソール左側の「ユーザー」をクリックし、画面右側の「ユーザーの作成」をクリックします。

<img width="1148" alt="1" src="https://github.com/seike460/serverless-performance-handson/assets/8141624/424cf295-c1ab-4d7e-9e74-c5df2ba674aa">

ユーザー名：お好きなあなたのユーザー名（handsonなど）<br>
「AWS マネジメントコンソールへのユーザーアクセスを提供する」にチェックを入れる<br>
コンソールパスワード：「カスタムパスワード」を選択しお好きなパスワードを入力<br>
「ユーザーは次回のサインイン時に新しいパスワードを作成する必要があります」のチェックを外す<br>

<img width="1382" alt="2" src="https://github.com/seike460/serverless-performance-handson/assets/8141624/04194fac-6dc2-44f2-9fa3-e61a1dcd4b85">

「次へ」をクリックし、「ポリシーを直接アタッチする」を選択して、許可ポリシーから「AdministratorAccess」を検索してチェックを入れます。

<img width="1396" alt="3" src="https://github.com/seike460/serverless-performance-handson/assets/8141624/f4bfe8f8-2caa-4cd3-acb8-4b12f30ec269">

「次へ」をクリックすると確認画面になるので、「ユーザーの作成」をクリックします。<br>
その後、マネコン右上のAWSアカウント名をクリックして「サインアウト」をクリックします。

ログイン後、Cloud9を作成します。

マネコン画面上部の検索バーから「Cloud9」を検索してクリックし、Cloud9サービスのコンソールへ移動します。<br>
「環境を作成」をクリックして、新たな開発環境用のEC2インスタンスをセットアップします。

インスタンスタイプを「t3.small (2 GiB RAM + 2 vCPU)」

名前はお好きなものを使ってください。<br>
その他はデフォルトのままで作成をクリックしてください。

もしデフォルトVPCを削除してしまっている場合は次のコマンドを CloudShellを利用して実行してください。<br>
デフォルトVPCを作成する事が出来ます。

```sh
aws ec2 create-default-vpc
```

<img width="904" alt="4" src="https://github.com/seike460/serverless-performance-handson/assets/8141624/5aba0eb9-50c2-434f-bf10-abd3fe90dd6c">

このシステムをデプロイするために、Git Cloneを行ってCloud9にプログラムを持ってきます。<br>
Cloud9のコンソールを開いて次のコマンドを実行してください。

```sh
git clone https://github.com/seike460/serverless-performance-handson
```

X-rayのトレーシングが出来るように以下コマンドを実行します。

```
cd serverless-performance-handson/lambda
npm install
```

その後AWS SAM（ https://aws.amazon.com/jp/serverless/sam ）を利用してビルドします。

`ビルド -> デプロイの流れを取らないと、変更が反映されないので注意してください。`

```sh
cd ../
sam build
```

`Build Succeeded` と表示されていればOK

続いてデプロイします。

```
sam deploy --guided

Configuring SAM deploy
======================

        Looking for config file [samconfig.toml] :  Found
        Reading default arguments  :  Success

        Setting default arguments for 'sam deploy'
        =========================================
        Stack Name [serverless-performance-handson]: serverless-performance-handson
        AWS Region [ap-northeast-1]: 
        #Shows you resources changes to be deployed and require a 'Y' to initiate deploy
        Confirm changes before deploy [Y/n]: Y
        #SAM needs permission to be able to create roles to connect to the resources in your template
        Allow SAM CLI IAM role creation [Y/n]: Y
        #Preserves the state of previously provisioned resources when an operation fails
        Disable rollback [y/N]: N
        PurchaseHandler has no authentication. Is this okay? [y/N]: y
        HistoryHandler has no authentication. Is this okay? [y/N]: y
        Save arguments to configuration file [Y/n]: Y
        SAM configuration file [samconfig.toml]: 
        SAM configuration environment [default]:


...

Previewing CloudFormation changeset before deployment
======================================================
Deploy this changeset? [y/N]: y

```

Stack Nameは任意ですが、それ以外は上記のように答えてください。<br>
デプロイされたら、表示された自分のURLをコピーしておいてください。 ... ※①

またインストールに時間がかかる 負荷試験ツールであるArtilleryをインストールします。

```sh
npm install -g artillery
```

ここまで行ったら説明を挟みます。

## 手順2

実際に負荷をかける事で、どこにボトルネックが存在するかを炙り出しましょう。<br>
load-first-test.ymlを編集して※①でコピーしておいたURLをtargetに設定しましょう。


その後、以下のコマンドを利用して負荷をかけます。<br>
Cloud9からリクエストが飛んで、先程デプロイしたAPIに負荷がかかります。<br>

```sh
artillery run load-first-test.yml
```

結果を見てみると、http.codes.502（Bad Gateway）が出てる方もいらっしゃるのではないでしょうか。<br>
負荷が高すぎて、APIが耐えれなかったという事になります。

後ほど結果比較出来るようにhttp.response_timeを記録しておきましょう。

```
http.response_time:
  min: ......................................................................... 30
  max: ......................................................................... 2489
  mean: ........................................................................ 761.4
  median: ...................................................................... 1022.7
  p95: ......................................................................... 1249.1
  p99: ......................................................................... 2143.5
```

応答時間: min、max、mean、median、p95、p99は応答時間の指標です。特にmean（平均応答時間）とp95（95パーセンタイル応答時間）が重要です。
これらの値が低いほど、システムの応答性が良いことを示します。

その後X-rayの画面に移動して、ボトルネックを特定してみます。

マネコン上部の検索バーで「X-Ray」を検索してクリックし、X-Rayサービスのコンソールに移動します。<br>

![5](https://github.com/seike460/serverless-performance-handson/assets/8141624/4111ee20-733a-404f-9700-130446fe0466)

Trace Mapが表示されているはずです。 <br>
ここで購入履歴の表示ｍｐ「serverless-performance-handson-HistoryHandler-XXXXXXX」が大量にエラー担っている事がわかります。<br>
なおかつDynamoDBに対しての接続でエラーとなっているようです。<br>

ソースコードを見てみると、じつはこのプログラムはDynamoDBを全Scanしている事がわかりました。<br>
すべてのデータを取得していると考えると、改善の余地がありますね

<img width="1004" alt="6" src="https://github.com/seike460/serverless-performance-handson/assets/8141624/be296fcb-36f5-4560-a57c-259a677e5bbb">

続いて購入処理の「serverless-performance-handson-PurchaseHandler-XXXXXXXX」を見ていると購入処理は成功しているのですが、１秒ほどかかっている事がわかります。<br>
どこで時間がかかっているかを特定するために、トレースの分析を押します。

「トレースのリスト」が下部にあるのでそちらの一番時間がかかっているものをクリックしてみます

セグメントのタイムラインを見てみると、DynamoDBではなくて処理に時間がかかっているようです。<br>
ソースコードを見てみると、「ここで別システムに対して購入処理を行っている」というコメントを見つけました。

これは私達ではどうしようもありません。
せめて購入時の体験を良くするために、SQSを利用した購入体験を向上させましょう。

## 手順3

それでは改善版のプログラムをデプロイします。<br>
まずCloud9のターミナルで、現在いるディレクトリを確認しましょう。

```bash
$ pwd
/home/ec2-user/environment/serverless-performance-handson
```

もし他のディレクトリ名が表示された場合は、一旦`serverless-performance-handson`内まで移動してください。

その後、以下のコマンドを実行して、すべてのプログラムを入れ替えます。

```
mv lambda first_lambda
mv Performance/* .
```

これでAWS Lambdaのソースコードを、新しいものに入れ替えることができました。
`ls -la`コマンドを実行すると、`first_lambda`と`lambda`ディレクトリの両方があることが確認できます。

```bash
$ ls -la
total 56
drwxr-xr-x. 7 ec2-user ec2-user 16384 Mar  2 00:14 .
drwxr-xr-x. 4 ec2-user ec2-user    72 Mar  1 23:39 ..
drwxr-xr-x. 5 ec2-user ec2-user    62 Mar  1 23:40 .aws-sam
drwxr-xr-x. 8 ec2-user ec2-user   163 Mar  1 23:39 .git
-rw-r--r--. 1 ec2-user ec2-user  3484 Mar  1 23:39 .gitignore
drwxr-xr-x. 2 ec2-user ec2-user     6 Mar  2 00:14 Performance
-rw-r--r--. 1 ec2-user ec2-user 11806 Mar  1 23:39 README.md
drwxr-xr-x. 3 ec2-user ec2-user   140 Mar  1 23:39 first_lambda
-rw-r--r--. 1 ec2-user ec2-user   356 Mar  1 23:39 generate-payload.js
drwxr-xr-x. 2 ec2-user ec2-user    92 Mar  1 23:39 lambda
```

Lambdaの中身が変わりましたので、再びビルドを行います。

```
$ sam build
```
`Build Succeeded`とメッセージが表示されれば、ビルド成功です。続いてデプロイも実行しましょう。

```
sam deploy
```

デプロイに成功すると、最後に次のようなメッセージが表示されます。

```
CloudFormation outputs from deployed stack
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Outputs                                                                                                                                                                                            
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Key                 ApiUrl                                                                                                                                                                         
Description         API Gateway endpoint URL for Prod stage                                                                                                                                        
Value               https://xxxx.execute-api.ap-northeast-1.amazonaws.com/Prod/                                                                                                              
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
```

URLが再度出力されるので、今度は`load-test.yml`のtargetにコピペします。


```diff
config:
-   target: 'https://eri3zmndn8.execute-api.ap-northeast-1.amazonaws.com/Prod/'
+  target: 'https://xxxx.execute-api.ap-northeast-1.amazonaws.com/Prod/'
  phases:

```


その後、負荷試験を行います。

```sh
artillery run load-test.yml
```

すると明らかに改善が見られる事がわかると思います。

```
http.response_time:
  min: ......................................................................... 0
  max: ......................................................................... 1588
  mean: ........................................................................ 50.8
  median: ...................................................................... 27.9
  p95: ......................................................................... 67.4
  p99: ......................................................................... 1380.5
```

`http.codes.502`もほとんど出なくなったのではないかと思います。

```
--------------------------------
Summary report @ 00:30:45(+0000)
--------------------------------

http.codes.200: ................................................................ 1754
http.codes.202: ................................................................ 1846
http.downloaded_bytes: ......................................................... 317151
http.request_rate: ............................................................. 61/sec
```

購入履歴の表示はDynamoDBはScanからQueryに変更されています。

```
  const params = {
    TableName: tableName,
    KeyConditionExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": { S: customerId }
    }
  };
  try {
    const command = new QueryCommand(params);
```

今回はパーティションキーのみの指定ですが、更にソートキーやセカンダリインデックスを活用する事でパフォーマンスの向上が見込めます。

また購入処理はSQSにデータを送信しておいて、バックエンド処理でDynamoDBに保存されるようになっています。
購入処理は自分たちではどうしようもないのですが、ユーザー体験は明らかに改善が見込めました。

## 手順4

ここから先は時間がある方が行ってみてください。

購入履歴の表示を更に改善してみましょう。<br>
今回購入履歴は、1分間キャシュを聞かせても良いという事になりました。<br>
そこで、API Gatewayのキャッシュをつかって更に負荷を軽減しましょう

template.yamlの `CacheClusterEnabled` のあたりのコメントアウトを解除してデプロイします。

その後デプロイを行い、負荷試験を行います。

```
sam build
sam deploy
artillery run load-test.yml
```

するとDynamoDBの読込処理が異常なまでに少なくなっている事がわかると思います。

## 後片付け

```
sam delete
Are you sure you want to delete the stack serverless-ec-shop in the region ap-northeast-1 ? [y/N]: y
Are you sure you want to delete the folder serverless-ec-shop in S3 which contains the artifacts? [y/N]: y
```

最後にCloud9を削除しておしまいです。
お疲れ様でした！
