use serde::{Deserialize, Serialize};

use crate::{
	parser::{
		lines_to_list, lines_to_text, list_to_lines, text_to_lines, Item, Line,
	},
	sys::get_sys_hosts_content,
};

#[derive(Deserialize, Serialize)]
pub struct TextToListResult {
	list: Vec<Item>,
	lines: Vec<Line>,
}

#[tauri::command]
pub fn text_to_list(text: String) -> TextToListResult {
	let lines = text_to_lines(&text);
	let list = lines_to_list(&lines);

	TextToListResult { list, lines }
}

#[derive(Deserialize, Serialize)]
pub struct ListToTextResult {
	text: String,
	lines: Vec<Line>,
}

#[tauri::command]
pub fn list_to_text(list: Vec<Item>, old_lines: Vec<Line>) -> ListToTextResult {
	let lines = list_to_lines(list, old_lines);
	let text = lines_to_text(&lines, cfg!(windows));

	ListToTextResult { text, lines }
}

#[tauri::command]
pub fn sys_hosts_content() -> String {
	get_sys_hosts_content()
}
