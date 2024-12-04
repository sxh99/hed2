use std::{collections::HashSet, net::IpAddr};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Clone)]
pub struct Group {
	pub name: String,
	pub text: String,
	lines: Vec<Line>,
	pub list: Vec<Item>,
}

pub fn is_ip(s: &str) -> bool {
	s.parse::<IpAddr>().is_ok()
}

fn text_to_lines(text: &str) -> Vec<Line> {
	let mut lines = vec![];

	for l in text.lines() {
		let line = l.trim();

		if line.is_empty() {
			lines.push(Line::Empty);
		} else if let Some(valid_line) = parse_valid_line(line) {
			lines.push(valid_line);
		} else if let Some(group_line) = parse_group_line(line) {
			lines.push(group_line);
		} else {
			lines.push(Line::Other(line.to_string()));
		}
	}

	lines
}

fn parse_valid_line(line: &str) -> Option<Line> {
	let enabled = !line.starts_with('#');
	let stripped = line.strip_prefix('#').unwrap_or(line);
	let (ip_hosts, _) = stripped.split_once('#').unwrap_or((stripped, ""));
	let (ip, hosts) = split_ip_hosts(ip_hosts)?;
	if hosts.is_empty() {
		Some(Line::Other(format!("# {}", ip)))
	} else {
		Some(Line::Valid { ip, hosts, enabled })
	}
}

fn split_ip_hosts(s: &str) -> Option<(String, Vec<String>)> {
	let chunks = s.split_whitespace().collect::<Vec<&str>>();

	if !chunks.is_empty() {
		let may_ip = chunks[0];
		if is_ip(may_ip) {
			return Some((
				may_ip.to_string(),
				chunks.into_iter().skip(1).map(|i| i.to_string()).collect(),
			));
		}
	}

	None
}

fn parse_group_line(line: &str) -> Option<Line> {
	let processed = line.strip_prefix('#')?.trim_start();
	let chs = processed.chars().collect::<Vec<char>>();
	if chs.len() >= 3 && chs[0] == '[' && chs[chs.len() - 1] == ']' {
		let mut name = String::new();
		for ch in &chs[1..chs.len() - 1] {
			if !ch.is_whitespace() {
				name.push(*ch);
			}
		}
		Some(Line::Group(name))
	} else {
		None
	}
}

fn lines_to_list(lines: &[Line], group: &str) -> Vec<Item> {
	let mut item_map: IndexMap<String, Item> = IndexMap::new();

	for line in lines {
		let Line::Valid { ip, hosts, enabled } = line else {
			continue;
		};

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

		if let Some(item) = item_map.get_mut(ip) {
			item.hosts.append(&mut hosts);
		} else {
			item_map.insert(
				ip.clone(),
				Item {
					ip: ip.clone(),
					hosts,
					group: group.to_string(),
				},
			);
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
	let mut ip_hosts_map = list
		.into_iter()
		.map(|item| (item.ip, item.hosts))
		.collect::<IndexMap<String, Vec<Host>>>();

	for line in old_lines {
		if let Line::Valid { ip, .. } = line {
			if let Some(hosts) = ip_hosts_map.get_mut(&ip) {
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

	for (ip, hosts) in ip_hosts_map {
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

fn lines_to_text_impl(lines: &[Line], is_win: bool) -> String {
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

	let eol = if is_win {
		"\r\n"
	} else {
		"\n"
	};

	text_lines.join(eol)
}

fn lines_to_text(lines: &[Line]) -> String {
	lines_to_text_impl(lines, cfg!(windows))
}

fn lines_to_groups(lines: &[Line]) -> Vec<Group> {
	let mut other_groups = vec![];
	let mut system_group = Group {
		name: "System".to_string(),
		text: String::new(),
		lines: vec![],
		list: vec![],
	};
	let mut current_group_name: Option<&String> = None;
	let mut group_lines: Vec<&Line> = vec![];

	for line in lines {
		if let Some(group_name) = current_group_name {
			if let Line::Group(name) = line {
				if name == group_name {
					let owned_lines = group_lines
						.clone()
						.into_iter()
						.cloned()
						.collect::<Vec<Line>>();
					other_groups.push(Group {
						name: name.clone(),
						text: lines_to_text(&owned_lines),
						list: lines_to_list(&owned_lines, name),
						lines: owned_lines,
					});
					group_lines.clear();
					current_group_name = None;
					continue;
				}
			}
			group_lines.push(line);
		} else if let Line::Group(name) = line {
			current_group_name = Some(name);
		} else {
			system_group.lines.push(line.clone());
		}
	}

	if !group_lines.is_empty() {
		system_group.lines.extend(group_lines.into_iter().cloned());
	}

	system_group.list = lines_to_list(&system_group.lines, &system_group.name);

	for group in &other_groups {
		system_group.list.append(&mut group.list.clone());
	}

	let mut groups = vec![system_group];
	groups.append(&mut other_groups);
	groups
}

pub fn text_to_groups(text: String) -> Vec<Group> {
	let lines = text_to_lines(&text);
	let mut groups = lines_to_groups(&lines);

	groups[0].text = text;
	groups[0].lines = lines;

	groups
}

#[cfg(test)]
mod tests {
	use insta::{assert_debug_snapshot, assert_snapshot};

	use super::{
		lines_to_text_impl, list_to_lines, parse_group_line, parse_valid_line,
		text_to_groups, Host, Item, Line,
	};

	#[test]
	fn test_parse_valid_line() {
		let cases = [
			"127.0.0.1 a.com b.com",
			"#    127.0.0.1     a.com   b.com",
			"127.0.0.1   a.com  b.com   #   comment",
		];
		assert!(cases.iter().all(|s| parse_valid_line(s).is_some_and(|l| {
			if let Line::Valid { ip, hosts, .. } = l {
				ip == "127.0.0.1"
					&& hosts == vec!["a.com".to_string(), "b.com".to_string()]
			} else {
				false
			}
		})));

		let cases = ["", "foo", "# foo"];
		assert!(cases.iter().all(|s| parse_valid_line(s).is_none()));

		let cases = ["# 1.1.1.1", "1.1.1.1"];
		assert!(cases.iter().all(|s| parse_valid_line(s).is_some_and(|l| {
			if let Line::Other(ss) = l {
				ss.starts_with('#')
			} else {
				false
			}
		})));
	}

	#[test]
	fn test_parse_group_line() {
		let cases = ["#[group]", "#   [   group    ]", "#[组]"];
		assert!(cases.iter().all(|s| parse_group_line(s).is_some_and(|l| {
			if let Line::Group(name) = l {
				name == "group" || name == "组"
			} else {
				false
			}
		})));

		let cases = ["", "group", "# group"];
		assert!(cases.iter().all(|s| parse_group_line(s).is_none()));
	}

	#[test]
	fn test_parser() {
		static MOCK_HOSTS: &str = include_str!("../fixture/hosts");

		let mut groups = text_to_groups(MOCK_HOSTS.to_string());
		assert_debug_snapshot!("text_to_groups", groups);

		let system_group = &mut groups[0];

		for item in &mut system_group.list {
			if item.ip == "127.0.0.1" {
				item.hosts.pop();
				item.hosts.push(Host {
					content: "o.com".to_string(),
					enabled: true,
				});
				item.hosts.push(Host {
					content: "13.com".to_string(),
					enabled: false,
				});
			} else if item.ip == "1.1.1.1" {
				item.hosts.retain(|host| host.enabled);
			}
		}

		system_group.list.push(Item {
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
			group: "System".to_string(),
		});

		let new_lines = list_to_lines(
			system_group.list.clone(),
			system_group.lines.clone(),
		);
		assert_debug_snapshot!("list_to_lines", new_lines);

		let text = lines_to_text_impl(&new_lines, true);
		assert_debug_snapshot!("lines_to_text_win", text);

		let text = lines_to_text_impl(&new_lines, false);
		assert_debug_snapshot!("lines_to_text_unix", text);
		assert_snapshot!("lines_to_text_human", text);
	}
}
