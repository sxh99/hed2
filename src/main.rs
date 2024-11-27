#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod command;
mod parser;

fn main() {
	run();
}

fn run() {
	if let Err(err) = tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![command::greet])
		.run(tauri::generate_context!())
	{
		eprintln!("{}", err);
	}
}
