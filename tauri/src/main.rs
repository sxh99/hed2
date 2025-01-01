#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod result_ext;
mod sys;

use anyhow::Result;
use result_ext::ResultExt;
use tauri::{webview::WebviewWindow, Manager, WindowEvent};
use tauri_plugin_window_state::{AppHandleExt, StateFlags, WindowExt};

fn main() {
	run().log_err();
}

fn run() -> Result<()> {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			read_system_hosts,
			write_system_hosts,
			view_github,
			open_hosts_dir,
			set_theme,
		])
		.plugin(tauri_plugin_single_instance::init(|app, _, _| {
			if let Some(ww) = app.get_webview_window("main") {
				ww.set_focus().log_err();
			}
		}))
		.setup(|app| {
			let ret = app
				.handle()
				.plugin(tauri_plugin_window_state::Builder::default().build());
			if ret.is_ok() {
				if let Some(ww) = app.get_webview_window("main") {
					ww.restore_state(StateFlags::all()).log_err();
					println!("restore window state");
					fix_restore_size(ww);
				}
			} else {
				ret.log_err();
			}

			Ok(())
		})
		.on_window_event(|window, we| {
			if let WindowEvent::CloseRequested { .. } = we {
				let app_handle = window.app_handle();
				let filename = app_handle.filename();
				if let Ok(dir) = app_handle.path().app_config_dir() {
					println!("app config dir: `{}`", dir.display());
				}
				app_handle.save_window_state(StateFlags::all()).log_err();
				println!("save window state to `{}`", filename);
			}
		})
		.run(tauri::generate_context!())?;

	Ok(())
}

#[tauri::command]
fn read_system_hosts() -> Result<String, String> {
	sys::read_hosts()
		.map_err(|_| "Failed to read system hosts file".to_string())
}

#[tauri::command]
fn write_system_hosts(content: String) -> Result<(), String> {
	sys::check_hosts_permissions().map_err(|err| err.to_string())?;
	sys::write_hosts(content)
		.map_err(|_| "Failed to write to system hosts file".to_string())
}

#[tauri::command]
fn view_github() {
	let url = env!("CARGO_PKG_REPOSITORY");
	opener::open_browser(url).log_err();
}

#[tauri::command]
fn open_hosts_dir() {
	sys::open_hosts_dir().log_err();
}

#[tauri::command]
fn set_theme(ww: tauri::WebviewWindow, theme: String) {
	use tauri::Theme::*;

	let window_theme = match theme.as_ref() {
		"light" => Some(Light),
		"dark" => Some(Dark),
		_ => None,
	};

	ww.set_theme(window_theme).log_err();
}

fn fix_restore_size(ww: WebviewWindow) {
	let Ok(Some(current_monitor)) = ww.current_monitor() else {
		return;
	};
	println!("current monitor: {:#?}", current_monitor);
	let scale_factor = current_monitor.scale_factor();
	if scale_factor == 1.0 {
		return;
	}
	let Ok(size) = ww.inner_size() else {
		return;
	};
	println!("current size: {:#?}", size);
	ww.set_size(size.to_logical::<u32>(scale_factor)).log_err();
	println!("fix size with scale factor");
}
