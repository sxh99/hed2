use std::{env, fs, path::PathBuf};

use anyhow::Result;

pub fn read_hosts() -> Result<String> {
	let hosts_path = get_hosts_path()?;
	let content = fs::read_to_string(hosts_path)?;

	Ok(content)
}

pub fn write_hosts(content: String) -> Result<()> {
	let hosts_path = get_hosts_path()?;
	let tmp_file = env::temp_dir().join("hed2_tmp");
	fs::write(&tmp_file, content)?;
	fs::copy(&tmp_file, hosts_path)?;
	fs::remove_file(&tmp_file)?;

	Ok(())
}

#[cfg(all(not(dev), windows))]
fn get_hosts_path() -> Result<PathBuf> {
	let sys_drive = env::var("SYSTEMDRIVE")?;

	Ok(PathBuf::from(format!(
		r"{}\Windows\System32\drivers\etc\hosts",
		sys_drive
	)))
}

#[cfg(all(not(dev), unix))]
fn get_hosts_path() -> Result<PathBuf> {
	Ok(PathBuf::from("/etc/hosts"))
}

#[cfg(dev)]
fn get_hosts_path() -> Result<PathBuf> {
	let mut cwd = env::current_dir()?;

	cwd.push("tmp");
	cwd.push("hosts");

	Ok(cwd)
}
