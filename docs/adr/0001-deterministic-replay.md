# ADR-0001 Deterministic Replay

- Decision: RNG/Time/LLM を Observation 化し、API からは供給しない
- Alternatives: 擬似固定 / 部分固定
- Consequences: 外部 I/O は Outbox 経由、再実行は履歴の関数で保証
- Date/Owners: 2025-09-16 / EM, TL, PdM
