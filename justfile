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
	node --run fmt
	cargo fmt
	taplo fmt

check:
	node --run check
	cargo fmt --check
	taplo fmt --check
	cargo clippy --all-features -- -D warnings
	just typecheck

typecheck:
	node --run typecheck:ui
	node --run typecheck:parser
	node --run typecheck:other
	node --run typecheck:electron

release-pr tag:
	pnpm tsx ./scripts/set-pkg-version.ts {{tag}}
	cargo set-version {{tag}}
	just fmt
	git commit -am "chore(release): {{tag}}"
	git push

push-tag tag:
	git tag {{tag}}
	git push origin {{tag}}

ui-dep +pkgs:
	pnpm {{pkgs}} --filter ./ui

electron-dep +pkgs:
	pnpm {{pkgs}} --filter ./electron

build-web:
	node --run build:parser
	node --run build:ui
