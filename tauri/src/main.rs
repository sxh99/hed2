#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sys;

fn main() {
	run();
}

fn run() {
	if let Err(err) = tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			read_system_hosts,
			view_github
		])
		.run(tauri::generate_context!())
	{
		eprintln!("{}", err);
	}
}

#[tauri::command]
fn read_system_hosts() -> String {
	sys::read_hosts_content()
}

#[tauri::command]
fn view_github() {
	let url = env!("CARGO_PKG_REPOSITORY");
	let _ = webbrowser::open(url);
}
