#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sys;

fn main() {
	run();
}

fn run() {
	if let Err(err) = tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			read_system_hosts,
			write_system_hosts,
			view_github,
			open_hosts_dir,
			set_theme,
		])
		.run(tauri::generate_context!())
	{
		eprintln!("{}", err);
	}
}

#[tauri::command]
fn read_system_hosts() -> Result<String, String> {
	sys::read_hosts()
		.map_err(|_| "Failed to read system hosts file".to_string())
}

#[tauri::command]
fn write_system_hosts(content: String) -> Result<(), String> {
	sys::write_hosts(content)
		.map_err(|_| "Failed to write to system hosts file".to_string())
}

#[tauri::command]
fn view_github() {
	let url = env!("CARGO_PKG_REPOSITORY");
	let _ = opener::open_browser(url);
}

#[tauri::command]
fn open_hosts_dir() {
	let _ = sys::open_hosts_dir();
}

#[tauri::command]
fn set_theme(ww: tauri::WebviewWindow, theme: String) {
	use tauri::Theme::*;

	let window_theme = match theme.as_ref() {
		"light" => Some(Light),
		"dark" => Some(Dark),
		_ => None,
	};

	let _ = ww.set_theme(window_theme);
}
