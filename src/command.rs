use serde::{Deserialize, Serialize};

use crate::{
	parser::{text_to_groups, Item},
	sys::get_sys_hosts_content,
};

#[derive(Deserialize, Serialize)]
pub struct GroupDTO {
	name: String,
	text: String,
	list: Vec<Item>,
}

#[tauri::command]
pub fn get_groups() -> Vec<GroupDTO> {
	let hosts_content = get_sys_hosts_content();
	let groups = text_to_groups(hosts_content);
	groups
		.into_iter()
		.map(|group| GroupDTO {
			name: group.name,
			text: group.text,
			list: group.list,
		})
		.collect()
}
