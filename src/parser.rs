use std::{collections::HashSet, net::IpAddr};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

const SYSTEM_GROUP_NAME: &str = "System";

#[derive(Debug, Clone)]
pub enum Line {
	Valid {
		ip: String,
		hosts: Vec<String>,
		enabled: bool,
	},
	Empty,
	Other(String),
	Group(String),
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Item {
	ip: String,
	hosts: Vec<Host>,
	group: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Host {
	content: String,
	enabled: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Group {
	name: String,
	text: String,
	list: Vec<Item>,
}

pub fn is_ip(s: &str) -> bool {
	s.parse::<IpAddr>().is_ok()
}

fn key(s1: &str, s2: &str) -> String {
	format!("{}_{}", s1, s2)
}

fn text_to_lines(text: &str) -> Vec<Line> {
	let mut lines = vec![];

	for line in text.lines() {
		let tokens = line.split_whitespace().collect::<Vec<&str>>();

		if tokens.is_empty() {
			lines.push(Line::Empty);
			continue;
		}

		if tokens.len() == 1 {
			if let Some(stripped) = tokens[0].strip_prefix("#[") {
				if let Some(group) = stripped.strip_suffix("]") {
					lines.push(Line::Group(group.trim().to_string()));
					continue;
				}
			}
		}

		let enabled = tokens[0] != "#";
		let may_ip = if enabled {
			tokens[0]
		} else {
			tokens[1]
		};

		if is_ip(may_ip) {
			let mut hosts = vec![];
			let skip = if enabled {
				1
			} else {
				2
			};

			for host in tokens.iter().skip(skip) {
				if let Some(idx) = host.find('#') {
					let slice = &host[0..idx];
					if !slice.is_empty() {
						hosts.push(slice.to_string());
					}
					break;
				}
				hosts.push(host.to_string());
			}

			if !hosts.is_empty() {
				lines.push(Line::Valid {
					ip: may_ip.to_string(),
					hosts,
					enabled,
				});
				continue;
			}
		}

		lines.push(Line::Other(line.trim().to_string()));
	}

	lines
}

fn lines_to_list(lines: &[Line], group: Option<&str>) -> Vec<Item> {
	let mut item_map: IndexMap<String, Item> = IndexMap::new();
	let mut current_group = group.unwrap_or(SYSTEM_GROUP_NAME);
	let mut tmp_map: IndexMap<String, Item> = IndexMap::new();

	for line in lines {
		match line {
			Line::Valid { ip, hosts, enabled } => {
				if hosts.is_empty() {
					continue;
				}

				let mut hosts = hosts
					.iter()
					.map(|content| Host {
						content: content.clone(),
						enabled: *enabled,
					})
					.collect::<Vec<Host>>();

				let key = key(current_group, ip);

				tmp_map
					.entry(key)
					.and_modify(|item| item.hosts.append(&mut hosts))
					.or_insert(Item {
						ip: ip.clone(),
						hosts,
						group: current_group.to_string(),
					});
			}
			Line::Group(name) => {
				if group.is_some()
					|| name == SYSTEM_GROUP_NAME
					|| current_group != SYSTEM_GROUP_NAME
						&& current_group != name
				{
					continue;
				}
				let t = tmp_map.clone();
				tmp_map.clear();
				for (k, mut v) in t {
					item_map
						.entry(k)
						.and_modify(|item| item.hosts.append(&mut v.hosts))
						.or_insert(v);
				}
				if current_group == name {
					current_group = SYSTEM_GROUP_NAME;
				} else {
					current_group = name;
				}
			}
			_ => (),
		}
	}

	if !tmp_map.is_empty() {
		for (k, mut v) in tmp_map {
			if group.is_none() {
				v.group = SYSTEM_GROUP_NAME.to_string();
			}
			item_map
				.entry(k)
				.and_modify(|item| item.hosts.append(&mut v.hosts))
				.or_insert(v);
		}
	}

	for item in item_map.values_mut() {
		let mut set: HashSet<String> = HashSet::new();

		item.hosts.retain(|host| {
			if set.contains(&host.content) {
				return false;
			}
			set.insert(host.content.clone());
			true
		});
	}

	item_map.into_values().collect()
}

pub fn text_to_groups(text: String) -> Vec<Group> {
	let lines = text_to_lines(&text);
	let mut group_map: IndexMap<String, Group> = IndexMap::new();
	let mut current_group: Option<&String> = None;
	let mut group_lines: Vec<&Line> = vec![];

	for line in &lines {
		if let Some(cur_group_name) = current_group {
			if let Line::Group(new_group_name) = line {
				if new_group_name == cur_group_name {
					let owned_lines = group_lines
						.clone()
						.into_iter()
						.cloned()
						.collect::<Vec<Line>>();
					let text = lines_to_text(&owned_lines);
					group_map
						.entry(new_group_name.clone())
						.and_modify(|group| {
							group.text = format!("{}\n{}", group.text, text);
						})
						.or_insert(Group {
							name: new_group_name.clone(),
							text,
							list: vec![],
						});
					group_lines.clear();
					current_group = None;
					continue;
				}
			}
			group_lines.push(line);
		} else if let Line::Group(name) = line {
			if name != SYSTEM_GROUP_NAME {
				current_group = Some(name);
			}
		}
	}

	let system_group = Group {
		name: SYSTEM_GROUP_NAME.to_string(),
		text,
		list: lines_to_list(&lines, None),
	};
	for item in &system_group.list {
		if let Some(group) = group_map.get_mut(&item.group) {
			group.list.push(item.clone());
		}
	}
	let mut groups = vec![system_group];
	groups.append(&mut group_map.into_values().collect::<Vec<Group>>());
	groups
}

fn hosts_partition(hosts: Vec<Host>) -> (Vec<Host>, Vec<Host>) {
	hosts.into_iter().partition(|host| host.enabled)
}

fn hosts_to_lines(hosts: Vec<Host>, ip: &str, enabled: bool) -> Vec<Line> {
	hosts
		.chunks(10)
		.map(|chunk| Line::Valid {
			ip: ip.to_string(),
			hosts: chunk.iter().cloned().map(|host| host.content).collect(),
			enabled,
		})
		.collect()
}

fn list_to_lines(list: Vec<Item>, old_lines: Vec<Line>) -> Vec<Line> {
	let mut lines = vec![];
	let mut hosts_map = list
		.into_iter()
		.map(|item| (item.ip, item.hosts))
		.collect::<IndexMap<String, Vec<Host>>>();

	for line in old_lines {
		if let Line::Valid { ip, .. } = line {
			if let Some(hosts) = hosts_map.get_mut(&ip) {
				if hosts.is_empty() {
					lines.push(Line::Empty);
					continue;
				}
				let mut new_hosts = vec![];
				new_hosts.append(hosts);
				let (enabled, disabled) = hosts_partition(new_hosts);
				lines.append(&mut hosts_to_lines(enabled, &ip, true));
				lines.append(&mut hosts_to_lines(disabled, &ip, false));
			} else {
				lines.push(Line::Empty);
			}
		} else {
			lines.push(line);
		}
	}

	for (ip, hosts) in hosts_map {
		if hosts.is_empty() {
			continue;
		}
		lines.push(Line::Empty);
		let (enabled, disabled) = hosts_partition(hosts);
		lines.append(&mut hosts_to_lines(enabled, &ip, true));
		lines.append(&mut hosts_to_lines(disabled, &ip, false));
	}

	lines
}

fn lines_to_text(lines: &[Line]) -> String {
	let mut text_lines = vec![];

	let mut is_pre_empty = lines
		.first()
		.is_some_and(|line| matches!(line, Line::Empty));

	for line in lines {
		match line {
			Line::Valid { ip, hosts, enabled } => {
				let mut vs = vec![];
				if !enabled {
					vs.push("#".to_string());
				}
				vs.push(ip.clone());
				vs.append(&mut hosts.clone());
				text_lines.push(vs.join(" "));
			}
			Line::Other(s) => {
				text_lines.push(s.clone());
			}
			Line::Empty => {
				if !is_pre_empty {
					text_lines.push(String::new());
				}
			}
			Line::Group(name) => {
				text_lines.push(format!("#[{}]", name));
			}
		};
		is_pre_empty = matches!(line, Line::Empty);
	}

	if !is_pre_empty {
		text_lines.push(String::new());
	}

	text_lines.join("\n")
}

pub fn list_to_text(list: Vec<Item>, old_text: String) -> String {
	let lines = text_to_lines(&old_text);
	let new_lines = list_to_lines(list, lines);
	lines_to_text(&new_lines)
}

#[cfg(test)]
mod tests {
	use insta::{assert_debug_snapshot, assert_snapshot};

	use super::{
		lines_to_list, lines_to_text, list_to_lines, text_to_groups,
		text_to_lines, Host, Item,
	};

	#[test]
	fn test_parser() {
		static MOCK_HOSTS: &str = include_str!("../fixture/hosts");

		let lines = text_to_lines(MOCK_HOSTS);
		assert_debug_snapshot!("text_to_lines", lines);

		let mut list = lines_to_list(&lines, None);
		assert_debug_snapshot!("lines_to_list", list);

		for item in &mut list {
			if item.ip == "1.1.1.1" {
				item.hosts.pop();
				item.hosts.push(Host {
					content: "o.com".to_string(),
					enabled: true,
				});
				item.hosts.push(Host {
					content: "13.com".to_string(),
					enabled: false,
				});
			} else if item.ip == "3.3.3.3" && item.group == "foo" {
				item.hosts.push(Host {
					content: "d.com".to_string(),
					enabled: true,
				})
			}
		}

		list.push(Item {
			ip: "2.2.2.2".to_string(),
			hosts: vec![
				Host {
					content: "foo.com".to_string(),
					enabled: true,
				},
				Host {
					content: "bar.com".to_string(),
					enabled: false,
				},
			],
			group: "Another Group".to_string(),
		});

		let new_lines = list_to_lines(list.clone(), lines.clone());
		assert_debug_snapshot!("list_to_lines", new_lines);

		let text = lines_to_text(&new_lines);
		assert_snapshot!("lines_to_text", text);

		let groups = text_to_groups(MOCK_HOSTS.to_string());
		assert_debug_snapshot!("text_to_groups", groups);
	}
}
