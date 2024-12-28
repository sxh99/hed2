use std::{env, fs, path::PathBuf};

pub fn read_hosts_content() -> String {
	get_hosts_path()
		.map(|path| fs::read_to_string(path).unwrap_or_default())
		.unwrap_or_default()
}

pub fn write_hosts_content(content: String) -> Result<(), std::io::Error> {
	if let Some(hosts_path) = get_hosts_path() {
		let tmp_file = env::temp_dir().join("hed_tmp");
		fs::write(&tmp_file, content)?;
		fs::copy(&tmp_file, hosts_path)?;
		fs::remove_file(&tmp_file)?;
	}

	Ok(())
}

#[cfg(all(not(dev), windows))]
fn get_hosts_path() -> Option<PathBuf> {
	env::var("SYSTEMDRIVE").ok().map(|sys_drive| {
		PathBuf::from(format!(
			r"{}\Windows\System32\drivers\etc\hosts",
			sys_drive
		))
	})
}

#[cfg(all(not(dev), unix))]
fn get_hosts_path() -> Option<PathBuf> {
	Some(PathBuf::from("/etc/hosts"))
}

#[cfg(dev)]
fn get_hosts_path() -> Option<PathBuf> {
	env::current_dir().ok().map(|mut path| {
		path.push("tmp");
		path.push("hosts");
		path
	})
}
