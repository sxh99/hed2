use std::{
	collections::{HashMap, HashSet},
	net::IpAddr,
};

use indexmap::IndexMap;

#[derive(Debug, Clone)]
enum Line {
	Valid(ValidLine),
	Empty,
	Other(String),
}

#[derive(Debug, Clone)]
struct ValidLine {
	ip: String,
	hosts: Vec<String>,
	comment: Option<String>,
	enabled: bool,
}

#[derive(Debug, Clone)]
struct Item {
	ip: String,
	hosts: Vec<Host>,
}

#[derive(Debug, Clone)]
struct Host {
	content: String,
	enabled: bool,
}

fn is_ip(s: &str) -> bool {
	s.parse::<IpAddr>().is_ok()
}

fn content_to_lines(s: &str) -> Vec<Line> {
	let mut lines = vec![];

	for l in s.lines() {
		let line = l.trim().to_string();

		if line.is_empty() {
			lines.push(Line::Empty);
		} else if let Some(valid_line) = parse_valid_line(&line) {
			lines.push(Line::Valid(valid_line));
		} else {
			lines.push(Line::Other(line));
		}
	}

	lines
}

fn parse_valid_line(s: &str) -> Option<ValidLine> {
	let (striped_s, enabled) = strip_comment(s);
	let (ip_hosts, comment) = split_ip_hosts_comment(striped_s);

	if let Some((ip, hosts)) = split_ip_hosts(ip_hosts) {
		Some(ValidLine {
			ip,
			hosts,
			comment: comment.map(|c| c.trim().to_string()),
			enabled,
		})
	} else {
		None
	}
}

fn strip_comment(s: &str) -> (&str, bool) {
	if let Some(striped) = s.strip_prefix('#') {
		(striped, false)
	} else {
		(s, true)
	}
}

fn split_ip_hosts_comment(s: &str) -> (&str, Option<&str>) {
	if let Some((may_ip_hosts, comment)) = s.split_once('#') {
		(may_ip_hosts, Some(comment))
	} else {
		(s, None)
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

fn lines_to_list(lines: &[Line]) -> Vec<Item> {
	let mut item_map: IndexMap<String, Item> = IndexMap::new();

	for line in lines {
		let Line::Valid(valid_line) = line else {
			continue;
		};

		let ValidLine {
			ip, hosts, enabled, ..
		} = valid_line.clone();

		if let Some(item) = item_map.get_mut(&ip) {
			for host in hosts {
				item.hosts.push(Host {
					content: host,
					enabled,
				});
			}
		} else {
			item_map.insert(
				ip.clone(),
				Item {
					ip,
					hosts: hosts
						.into_iter()
						.map(|host| Host {
							content: host,
							enabled,
						})
						.collect(),
				},
			);
		}
	}

	for item in item_map.values_mut() {
		item.hosts.sort_unstable_by_key(|host| host.content.clone());
		item.hosts.dedup_by_key(|host| host.content.clone());
	}

	item_map.into_values().collect()
}

fn gen_key(ip: &str, enabled: bool) -> String {
	format!("{}{}", ip, enabled)
}

fn remove_lines_by_indices(
	lines: Vec<Line>,
	indices: &mut HashSet<usize>,
) -> Vec<Line> {
	let mut new_lines = vec![];
	for (i, line) in lines.into_iter().enumerate() {
		if !indices.contains(&i) {
			new_lines.push(line);
		}
	}
	indices.clear();
	new_lines
}

fn new_lines_by_list(mut lines: Vec<Line>, list: &[Item]) -> Vec<Line> {
	let mut indices_to_removed: HashSet<usize> = HashSet::new();
	let mut ip_enabled_set: HashSet<String> = HashSet::new();

	for (i, line) in lines.iter().enumerate() {
		if let Line::Valid(valid_line) = line {
			let key = gen_key(&valid_line.ip, valid_line.enabled);
			if ip_enabled_set.contains(&key) {
				indices_to_removed.insert(i);
			} else {
				ip_enabled_set.insert(key);
			}
		}
	}

	lines = remove_lines_by_indices(lines, &mut indices_to_removed);

	let mut line_idx_map: HashMap<String, usize> = HashMap::new();

	for (i, line) in lines.iter().enumerate() {
		if let Line::Valid(valid_line) = line {
			line_idx_map.insert(gen_key(&valid_line.ip, valid_line.enabled), i);
		}
	}

	let mut list_ip_set: HashSet<&str> = HashSet::new();

	for item in list {
		let mut enabled_hosts = vec![];
		let mut disabled_hosts = vec![];

		for host in &item.hosts {
			if host.enabled {
				enabled_hosts.push(host.content.clone());
			} else {
				disabled_hosts.push(host.content.clone());
			}
		}

		if let Some(idx) = line_idx_map.get(&gen_key(&item.ip, true)) {
			if let Some(Line::Valid(valid_line)) = lines.get_mut(*idx) {
				valid_line.hosts = enabled_hosts;
			}
		} else {
			lines.push(Line::Valid(ValidLine {
				ip: item.ip.clone(),
				hosts: enabled_hosts,
				comment: None,
				enabled: true,
			}));
		}

		if let Some(idx) = line_idx_map.get(&gen_key(&item.ip, false)) {
			if let Some(Line::Valid(valid_line)) = lines.get_mut(*idx) {
				valid_line.hosts = disabled_hosts;
			}
		} else {
			lines.push(Line::Valid(ValidLine {
				ip: item.ip.clone(),
				hosts: disabled_hosts,
				comment: None,
				enabled: false,
			}));
		}

		list_ip_set.insert(&item.ip);
	}

	for (i, line) in lines.iter().enumerate() {
		if let Line::Valid(valid_line) = line {
			if valid_line.hosts.is_empty()
				|| !list_ip_set.contains(valid_line.ip.as_str())
			{
				indices_to_removed.insert(i);
			}
		}
	}

	lines = remove_lines_by_indices(lines, &mut indices_to_removed);

	let mut is_previous_line_empty = if lines.is_empty() {
		false
	} else {
		matches!(lines[0], Line::Empty)
	};

	for (i, line) in lines.iter().enumerate() {
		let is_line_empty = matches!(line, Line::Empty);
		if is_line_empty && is_previous_line_empty {
			indices_to_removed.insert(i);
		}
		is_previous_line_empty = is_line_empty;
	}

	lines = remove_lines_by_indices(lines, &mut indices_to_removed);

	if lines
		.last()
		.is_some_and(|line| !matches!(line, Line::Empty))
	{
		lines.push(Line::Empty);
	}

	lines
}

#[cfg(test)]
mod tests {
	use insta::assert_debug_snapshot;

	use super::{content_to_lines, lines_to_list};

	static MOCK_HOSTS: &str = include_str!("../fixture/hosts");

	#[test]
	fn test_parser() {
		let lines = content_to_lines(MOCK_HOSTS);
		assert_debug_snapshot!("content_to_lines", lines);

		let list = lines_to_list(&lines);
		assert_debug_snapshot!("lines_to_list", list);
	}
}
