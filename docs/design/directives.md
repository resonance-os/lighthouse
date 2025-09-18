# directives.md (予定)

@resonance-os/lighthouse
.
├── .github
│   ├── workflows
│   │   └── ci.yml
│   └── pull_request_template.md
├── .config
│   ├── policies
│   │   └── check_signoff.json
│   ├── allowed_signers
│   └── routes
│      ├── api.yaml # REST API ルート
│      └── internal.yaml # 内部ルート
├── benchmarks
├── bin
│   └── cli.ts
├── docs
│   ├── adr
│   ├── design
│   │   ├── architecture.md
│   │   ├── data-model.md
│   │   └── philosophy.md
│   ├── dev
│   │   └── setup.md
│   ├── planning
│   │   ├── current-sprint.md
│   │   ├── technical-decisions.md
│   │   └── v0.2.0-requirements.md
│   └── specs
│      ├── api-spec.md
│      ├── context-standards.md
│      └── protocol.md
├── i18n
│   └── Readme-jp.md
├── logs
├── modules
│   ├── agent
│   │   ├── deps.ts
│   │   ├── handlers
│   │   │   └── chat_handler.ts
│   │   ├── router.ts
│   │   └── server.ts
│   ├── analyzer # 旧 receptor
│   ├── benchmarks
│   ├── clock
│   │   ├── deps.ts
│   │   ├── handlers
│   │   │   └── teach_handler.ts
│   │   ├── lib
│   │   │   └── rng.ts
│   │   ├── router.ts
│   │   └── server.ts
│   ├── core # 全てが I/O を持たない純関数なので、拡張は容易、まずは reduce.ts でのテストを行う
│   │   ├── gradient.ts # estimateGradient()
│   │   ├── guardrails.ts # violatesNonHypnosis()
│   │   ├── core.ts # computeResonance()
│   │   ├── reduce.ts # core.ts に後に統合するかも
│   │   └── measure.ts
│   ├── ingress # 旧 membrane(app-api)
│   │   ├── deps.ts
│   │   ├── port.ts # （プロトコル変換）: HTTP/WS/gRPC → 内部 `Dialogue`
│   │   ├── gate.ts # （契約の即時検証）: schema/actor/path を**決定論的**に判定（OK/422）
│   │   ├── ledger.ts # （書き込み窓口）: **SSOT への append** だけを担当（唯一の書き込み者）
│   │   ├── push.ts # （応答）: SSE/HTTP 応答整形（副作用はここだけ）
│   │   ├── handlers
│   │   │   ├── observation_handler.ts
│   │   │   ├── replay_handler.ts
│   │   │   ├── snapshot_handler.ts
│   │   │   ├── state_handler.ts
│   │   │   └── teach_handler.ts
│   │   ├── router.ts
│   │   ├── server.ts
│   │   └── etc...
│   ├── sandbox # 新規
│   ├── shared
│   │   └── contracts
│   │      └── observation.ts
│   └── ssot # 整理中
│      ├── index.ts
│      ├── deps.ts
│      ├── .data
│      │   ├── observations.ndjson
│      │   ├── outbox.ndjson
│      │   └── outbox_done
│      ├── index.ts
│      ├── adapters
│      │   ├── ssot_kv.ts
│      │   ├── ssot_sqlite.ts
│      │   └── ssot_ndjson.ts
│      ├── schema
│      │   ├── index.schema.ts
│      │   └── ...
│      └── interfaces
│         ├── index.ts
│         └── ...
├── scripts
│   ├── dev
│   │   ├── bootstrap.sh
│   │   └── test-commands.sh
│   ├── deploy/ # デプロイ用スクリプト
│   │   ├── build.sh
│   │   └── release.sh
│   └── tools/ # ユーティリティ
│      ├── sbom.sh
│      └── snapshot.sh
├── security
│   └── sbom
├── test
│   ├── data/ # テストデータ
│   │   ├── observations/ # 観測テストデータ
│   │   └── expected/ # 期待結果
│   └── fixtures/ # テストフィクスチャ
│      └── ingress/ # Ingress 設定
├── .env.example
├── .gitignore
├── .mcp.json # まだ空
├── .pre-commit-config.yaml # まだ空
├── AGENTS.md # まだ空
├── CLAUDE.md # まだ空
├── deno.json
├── deno.lock
├── LICENSE
├── mise.toml
└── README.md # まだ空
