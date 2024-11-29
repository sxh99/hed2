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
			command::text_to_list,
			command::sys_hosts_content,
			command::list_to_text,
		])
		.run(tauri::generate_context!())
	{
		eprintln!("{}", err);
	}
}
