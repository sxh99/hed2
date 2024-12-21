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
	node --run typecheck

release-pr tag:
	git checkout -b "release-{{tag}}"
	cargo set-version {{tag}}
	git commit -am "chore(release): {{tag}}"
	git push --set-upstream origin release-{{tag}}

push-tag tag:
	git tag {{tag}}
	git push origin {{tag}}

run:
	node --experimental-strip-types ./scripts/run.ts

ta:
	INSTA_UPDATE=always cargo test

tu: 
	INSTA_UPDATE=unseen cargo test
