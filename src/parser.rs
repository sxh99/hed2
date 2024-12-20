use std::{collections::HashSet, net::IpAddr};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

const SYSTEM_GROUP: &str = "System";

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
	let mut tmp_map: IndexMap<String, Item> = IndexMap::new();
	let mut current_group = group.unwrap_or(SYSTEM_GROUP);

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
					|| name == SYSTEM_GROUP
					|| (current_group != SYSTEM_GROUP && current_group != name)
				{
					continue;
				}
				for (k, mut v) in tmp_map.clone() {
					item_map
						.entry(k)
						.and_modify(|item| item.hosts.append(&mut v.hosts))
						.or_insert(v);
				}
				tmp_map.clear();
				if current_group == name {
					current_group = SYSTEM_GROUP;
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
				v.group = SYSTEM_GROUP.to_string();
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
	use std::ops::Range;

	let lines = text_to_lines(&text);
	let mut range_map: IndexMap<String, Vec<Range<usize>>> = IndexMap::new();
	let mut current_range: Range<usize> = 0..0;
	let mut current_group: Option<&String> = None;

	for (idx, line) in lines.iter().enumerate() {
		let Line::Group(group) = line else {
			continue;
		};
		if group == SYSTEM_GROUP {
			continue;
		}
		if let Some(pre_group) = current_group {
			if group == pre_group {
				current_group = None;
				current_range.end = idx;
				range_map
					.entry(group.clone())
					.and_modify(|ranges| {
						ranges.push(current_range.clone());
					})
					.or_insert(vec![current_range.clone()]);
				current_range = 0..0;
			}
		} else {
			current_group = Some(group);
			current_range.start = idx + 1;
		}
	}

	let raw_lines = text.lines().collect::<Vec<&str>>();
	let mut group_map: IndexMap<String, Group> = IndexMap::new();

	for (group, ranges) in range_map {
		let mut vs: Vec<&str> = vec![];
		for range in ranges {
			vs.extend(&raw_lines[range]);
		}
		group_map.insert(
			group.clone(),
			Group {
				name: group,
				text: vs.join("\n"),
				list: vec![],
			},
		);
	}

	let system_group = Group {
		name: SYSTEM_GROUP.to_string(),
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

fn hosts_chunk(hosts: Vec<Host>, ip: &str) -> Vec<Line> {
	let mut lines = vec![];

	let (enabled_hosts, disabled_hosts): (Vec<_>, Vec<_>) =
		hosts.into_iter().partition(|host| host.enabled);

	let map_fn = |chunk: &[Host], enabled: bool| Line::Valid {
		ip: ip.to_string(),
		hosts: chunk.iter().cloned().map(|host| host.content).collect(),
		enabled,
	};

	lines.extend(enabled_hosts.chunks(10).map(|chunk| map_fn(chunk, true)));
	lines.extend(disabled_hosts.chunks(10).map(|chunk| map_fn(chunk, false)));

	lines
}

fn list_to_lines(list: Vec<Item>, old_lines: Vec<Line>) -> Vec<Line> {
	let mut lines = vec![];
	let mut sys_hosts_map: IndexMap<String, Vec<Host>> = IndexMap::new();
	let mut other_item_map: IndexMap<String, Vec<Item>> = IndexMap::new();

	for mut item in list {
		if item.group == SYSTEM_GROUP {
			sys_hosts_map
				.entry(item.ip)
				.and_modify(|hosts| {
					hosts.append(&mut item.hosts);
				})
				.or_insert(item.hosts);
		} else if let Some(items) = other_item_map.get_mut(&item.group) {
			items.push(item);
		} else {
			other_item_map.insert(item.group.clone(), vec![item]);
		}
	}

	let mut current_group: Option<String> = None;

	for line in old_lines {
		match line {
			Line::Valid { ip, .. } => {
				if current_group.is_some() {
					continue;
				}
				if let Some(hosts) = sys_hosts_map.get_mut(&ip) {
					if hosts.is_empty() {
						lines.push(Line::Empty);
						continue;
					}
					let mut new_hosts = vec![];
					new_hosts.append(hosts);
					lines.append(&mut hosts_chunk(new_hosts, &ip));
				} else {
					lines.push(Line::Empty);
				}
			}
			Line::Group(group) => {
				if group == SYSTEM_GROUP {
					continue;
				}
				if let Some(pre_group) = &current_group {
					if *pre_group == group {
						current_group = None;
						let Some(items) = other_item_map.get_mut(&group) else {
							continue;
						};
						if items.is_empty() {
							continue;
						}
						let mut new_items = vec![];
						new_items.append(items);
						lines.push(Line::Group(group.clone()));
						for item in new_items {
							lines
								.append(&mut hosts_chunk(item.hosts, &item.ip));
						}
						lines.push(Line::Group(group.clone()));
					}
				} else {
					current_group = Some(group);
				}
			}
			_ => {
				lines.push(line);
			}
		}
	}

	for (ip, hosts) in sys_hosts_map {
		if hosts.is_empty() {
			continue;
		}
		lines.append(&mut hosts_chunk(hosts, &ip));
	}

	for (group, items) in other_item_map {
		if items.is_empty() {
			continue;
		}
		lines.push(Line::Empty);
		lines.push(Line::Group(group.clone()));
		for item in items {
			lines.append(&mut hosts_chunk(item.hosts, &item.ip));
		}
		lines.push(Line::Group(group.clone()));
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
