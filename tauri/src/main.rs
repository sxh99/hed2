#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod command;
mod parser;
mod sys;

fn main() {
	run();
}

fn run() {
	if let Err(err) = tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			command::get_groups,
			command::is_ip,
			command::update_text_by_list,
		])
		.run(tauri::generate_context!())
	{
		eprintln!("{}", err);
	}
}
