# Makefile
# Resonance-OS のビルド/起動/テストタスク

.PHONY: install run test clean logs

install:
	@echo "✅ No installation required. Deno runs directly."

run:
	@echo "🚀 Starting Resonance-OS..."
	bash ./bin/run.sh

test:
	@echo "🧪 Running integration tests..."
	bash ./bin/test-commands.sh

logs:
	@echo "📄 Last 10 lines of each log:"
	@tail -n 10 logs/*.log 2>/dev/null || echo "No log files yet."

clean:
	@echo "🧹 Cleaning up..."
	@rm -f logs/*.pid logs/*.log
	@rm -f data/observations.json
	@mkdir -p data logs
	@echo "✅ Clean complete"