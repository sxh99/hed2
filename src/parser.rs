use std::{collections::HashSet, net::IpAddr};

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Line {
	Valid {
		ip: String,
		hosts: Vec<String>,
		enabled: bool,
	},
	Empty,
	Other(String),
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Item {
	ip: String,
	hosts: Vec<Host>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Host {
	content: String,
	enabled: bool,
}

fn is_ip(s: &str) -> bool {
	s.parse::<IpAddr>().is_ok()
}

pub fn text_to_lines(text: &str) -> Vec<Line> {
	let mut lines = vec![];

	for l in text.lines() {
		let line = l.trim();

		if line.is_empty() {
			lines.push(Line::Empty);
		} else if let Some(valid_line) = parse_valid_line(line) {
			lines.push(valid_line);
		} else {
			lines.push(Line::Other(line.to_string()));
		}
	}

	lines
}

fn parse_valid_line(s: &str) -> Option<Line> {
	let enabled = !s.starts_with('#');
	let striped = s.strip_prefix('#').unwrap_or(s);
	let (ip_hosts, _) = striped.split_once('#').unwrap_or((striped, ""));

	if let Some((ip, hosts)) = split_ip_hosts(ip_hosts) {
		Some(Line::Valid { ip, hosts, enabled })
	} else {
		None
	}
}

fn split_ip_hosts(s: &str) -> Option<(String, Vec<String>)> {
	let chunks = s.split_whitespace().collect::<Vec<&str>>();

	if chunks.len() > 1 {
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

pub fn lines_to_list(lines: &[Line]) -> Vec<Item> {
	let mut item_map: IndexMap<String, Item> = IndexMap::new();

	for line in lines {
		let Line::Valid { ip, hosts, enabled } = line else {
			continue;
		};

		let hosts = hosts
			.iter()
			.map(|content| Host {
				content: content.clone(),
				enabled: *enabled,
			})
			.collect::<Vec<Host>>();

		if let Some(item) = item_map.get_mut(ip) {
			item.hosts.extend(hosts);
		} else {
			item_map.insert(
				ip.clone(),
				Item {
					ip: ip.clone(),
					hosts,
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

pub fn list_to_lines(list: Vec<Item>, old_lines: Vec<Line>) -> Vec<Line> {
	let mut lines = vec![];
	let mut ip_hosts_map = list
		.into_iter()
		.map(|item| (item.ip, item.hosts))
		.collect::<IndexMap<String, Vec<Host>>>();

	let mut is_pre_empty = old_lines
		.first()
		.is_some_and(|line| matches!(line, Line::Empty));

	for line in old_lines {
		match line {
			line @ Line::Empty => {
				if !is_pre_empty {
					lines.push(line);
					is_pre_empty = true;
				}
			}
			line @ Line::Other(_) => {
				lines.push(line);
				is_pre_empty = false;
			}
			Line::Valid { ip, .. } => {
				if let Some(hosts) = ip_hosts_map.get_mut(&ip) {
					if hosts.is_empty() {
						if !is_pre_empty {
							lines.push(Line::Empty);
						}
						is_pre_empty = true;
						continue;
					}
					let mut new_hosts = vec![];
					new_hosts.append(hosts);
					let (enabled, disabled) = hosts_partition(new_hosts);
					lines.extend(hosts_to_lines(enabled, &ip, true));
					lines.extend(hosts_to_lines(disabled, &ip, false));
					is_pre_empty = false;
				} else {
					is_pre_empty = true;
				}
			}
		}
	}

	for (ip, hosts) in ip_hosts_map {
		if hosts.is_empty() {
			continue;
		}
		let (enabled, disabled) = hosts_partition(hosts);
		if enabled.len() + disabled.len() > 0 && !is_pre_empty {
			lines.push(Line::Empty);
		}
		lines.extend(hosts_to_lines(enabled, &ip, true));
		lines.extend(hosts_to_lines(disabled, &ip, false));
	}

	if !lines.last().is_some_and(|line| matches!(line, Line::Empty)) {
		lines.push(Line::Empty);
	}

	lines
}

pub fn lines_to_text(lines: &[Line], is_win: bool) -> String {
	let mut text_lines = vec![];

	for line in lines {
		let text_line = match line {
			Line::Valid { ip, hosts, enabled } => {
				let mut vs = vec![];
				if !enabled {
					vs.push("#".to_string());
				}
				vs.push(ip.clone());
				vs.extend(hosts.clone());
				vs.join(" ")
			}
			Line::Other(s) => s.clone(),
			Line::Empty => String::new(),
		};

		text_lines.push(text_line);
	}

	let eol = if is_win {
		"\r\n"
	} else {
		"\n"
	};

	text_lines.join(eol)
}

#[cfg(test)]
mod tests {
	use insta::{assert_debug_snapshot, assert_snapshot};

	use super::{
		lines_to_list, lines_to_text, list_to_lines, text_to_lines, Host, Item,
	};

	static MOCK_HOSTS: &str = include_str!("../fixture/hosts");

	#[test]
	fn test_parser() {
		let lines = text_to_lines(MOCK_HOSTS);
		assert_debug_snapshot!("text_to_lines", lines);

		let mut list = lines_to_list(&lines);
		assert_debug_snapshot!("lines_to_list", list);

		for item in &mut list {
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
		});

		let new_lines = list_to_lines(list, lines);
		assert_debug_snapshot!("list_to_lines", new_lines);

		let text = lines_to_text(&new_lines, true);
		assert_debug_snapshot!("lines_to_text_win", text);

		let text = lines_to_text(&new_lines, false);
		assert_debug_snapshot!("lines_to_text_unix", text);
		assert_snapshot!("lines_to_text_human", text);
	}
}
