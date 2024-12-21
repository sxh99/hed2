use crate::{
	parser::{is_ip as is_ip_impl, list_to_text, text_to_groups, Group, Item},
	sys::get_sys_hosts_content,
};

#[tauri::command]
pub fn get_groups() -> Vec<Group> {
	let text = get_sys_hosts_content();
	text_to_groups(text)
}

#[tauri::command]
pub fn is_ip(text: String) -> bool {
	is_ip_impl(&text)
}

#[tauri::command]
pub fn update_text_by_list(
	list: Vec<Item>,
	text: String,
	group: Option<String>,
) -> String {
	list_to_text(list, text, group)
}
