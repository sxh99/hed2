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
	git checkout -b "release-{{tag}}"
	cargo set-version {{tag}}
	git commit -am "chore(release): {{tag}}"
	git push --set-upstream origin release-{{tag}}

push-tag tag:
	git tag {{tag}}
	git push origin {{tag}}

ui-dep +pkgs:
	pnpm {{pkgs}} --filter ./ui

electron-dep +pkgs:
	pnpm {{pkgs}} --filter ./electron

build-tauri:
	node --run build:parser
	node --run build:ui
	pnpm tauri build --no-bundle

build-electron:
	node --run build:parser
	node --run build:ui
	node --run build:electron
