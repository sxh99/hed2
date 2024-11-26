alias rp := release-pr
alias pt := push-tag

default:
	just --list --unsorted

toolchain:
	rustup -V
	rustc -V
	cargo -V
	cargo fmt --version
	cargo clippy -V
	node -v
	npm -v
	pnpm -v
	pnpm tauri -V

fmt:
	pnpm biome check --linter-enabled=false --write
	cargo fmt
	taplo fmt

lint: fmt
	pnpm biome lint
	cargo clippy --all-features

check:
	pnpm biome check
	cargo fmt --check
	taplo fmt --check
	cargo clippy --all-features -- -D warnings

release-pr tag:
	git checkout -b "release-{{tag}}"
	cargo set-version {{tag}}
	git commit -am "chore(release): {{tag}}"
	git push --set-upstream origin release-{{tag}}

push-tag tag:
	git tag {{tag}}
	git push origin {{tag}}

run:
	node ./scripts/dev.js
