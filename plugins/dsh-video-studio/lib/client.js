window.__ModuleLoader__.load({
	id: "dsh-video-studio",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		const React = require("react");
		const h = React.createElement;
		const { useCallback, useEffect, useMemo, useRef, useState } = React;

		const PANEL_ID = "video-studio";
		const API_ROOT = "video-studio";

		function apiUrl(path) {
			return new URL(API_ROOT + path, document.baseURI).toString();
		}

		async function getState() {
			const response = await fetch(apiUrl("/api/state"), { cache: "no-store" });
			if (!response.ok) throw new Error("HTTP " + response.status);
			return await response.json();
		}

		async function postJson(path, body) {
			const response = await fetch(apiUrl(path), {
				method: "POST",
				headers: { "content-type": "application/json", "x-video-studio": "1" },
				body: JSON.stringify(body ?? {}),
			});
			const value = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(value.error || "HTTP " + response.status);
			return value;
		}

		const CSS = `
.dvs-root{height:100%;overflow:auto;padding:26px 30px 56px;font-size:14px;line-height:1.5;
  color:var(--dsw-alias-label-primary,inherit);}
.dvs-inner{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.dvs-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.dvs-title{margin:0;font-size:22px;line-height:1.25;font-weight:650;letter-spacing:-.01em}
.dvs-sub{margin:4px 0 0;font-size:13px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-card{border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.25));border-radius:14px;
  background:color-mix(in srgb,currentColor 3%,transparent);padding:16px}
.dvs-promptHead{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:600;font-size:13px}
.dvs-promptHead .dvs-dim{font-weight:400}
.dvs-field{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.3));
  border-radius:10px;background:color-mix(in srgb,currentColor 2%,transparent);color:inherit;
  font:inherit;padding:10px 12px;outline:none;resize:vertical;min-height:78px}
.dvs-field:focus{border-color:#4f7cff;box-shadow:0 0 0 3px rgba(79,124,255,.18)}
.dvs-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.dvs-select,.dvs-input{border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.3));border-radius:9px;
  background:color-mix(in srgb,currentColor 2%,transparent);color:inherit;font:inherit;padding:7px 9px;outline:none}
.dvs-input{width:64px}
.dvs-btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.3));
  border-radius:9px;background:transparent;color:inherit;font:inherit;font-weight:550;padding:7px 12px;cursor:pointer;
  transition:background .12s ease,border-color .12s ease,opacity .12s ease}
.dvs-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.dvs-btn:disabled{opacity:.5;cursor:default}
.dvs-btn-primary{background:#4f7cff;border-color:#4f7cff;color:#fff}
.dvs-btn-primary:hover:not(:disabled){background:#3f6df0;border-color:#3f6df0}
.dvs-btn-ghost{border-color:transparent;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-spacer{flex:1}
.dvs-banner{border:1px solid rgba(255,120,90,.5);background:rgba(255,120,90,.1);border-radius:10px;
  padding:10px 12px;font-size:13px;display:flex;gap:10px;align-items:center}
.dvs-notice{border:1px solid rgba(79,124,255,.4);background:rgba(79,124,255,.1);border-radius:10px;
  padding:9px 12px;font-size:13px}
.dvs-main{display:grid;grid-template-columns:340px minmax(0,1fr);gap:14px;align-items:start}
@media(max-width:1040px){.dvs-main{grid-template-columns:1fr}}
.dvs-list{display:flex;flex-direction:column;gap:6px;max-height:440px;overflow:auto;padding-right:2px}
.dvs-listHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:4px;
  font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;
  color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-row{display:flex;align-items:center;gap:10px;text-align:left;padding:8px;cursor:pointer;
  border:1px solid transparent;border-radius:10px;background:transparent;color:inherit;font:inherit;
  transition:background .12s ease,border-color .12s ease}
.dvs-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1))}
.dvs-row[data-active="true"]{border-color:#4f7cff;background:rgba(79,124,255,.08)}
.dvs-rowThumb{position:relative;flex:0 0 auto;width:72px;height:48px;border-radius:6px;overflow:hidden;
  background:linear-gradient(140deg,#2a2350,#0c1020 65%);display:flex;align-items:center;justify-content:center;color:#cfd6ff}
.dvs-rowThumb img{width:100%;height:100%;object-fit:cover;display:block}
.dvs-rowBody{min-width:0;display:flex;flex-direction:column;gap:2px}
.dvs-rowTitle{font-weight:600;font-size:13px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dvs-rowMeta{font-size:11.5px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95));overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.dvs-detail{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,1fr);gap:14px;align-items:start}
@media(max-width:820px){.dvs-detail{grid-template-columns:1fr}}
.dvs-playerCol{display:flex;flex-direction:column;gap:10px;min-width:0}
.dvs-player{width:100%;height:min(56vh,520px);object-fit:contain;border-radius:12px;background:#05060b;
  border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.25))}
.dvs-emptyPlayer{height:min(46vh,420px);border-radius:12px;border:1px dashed var(--dsw-alias-border-l3,rgba(127,127,127,.35));
  display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95));font-size:13px;
  background:color-mix(in srgb,currentColor 2%,transparent)}
.dvs-timeline{display:flex;flex-wrap:wrap;gap:6px}
.dvs-scene{font-size:11px;border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.3));border-radius:6px;
  padding:3px 6px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95));max-width:180px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.dvs-side{display:flex;flex-direction:column;gap:12px;min-width:0}
.dvs-metaRow{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;padding:4px 0;
  border-bottom:1px solid color-mix(in srgb,currentColor 8%,transparent)}
.dvs-metaRow span:first-child{color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-metaRow code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11.5px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;max-width:60%}
.dvs-actions{display:flex;flex-wrap:wrap;gap:8px}
.dvs-job{border:1px solid var(--dsw-alias-border-l3,rgba(127,127,127,.25));border-radius:10px;padding:10px;
  background:color-mix(in srgb,currentColor 2%,transparent)}
.dvs-jobHead{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;margin-bottom:6px}
.dvs-dot{width:8px;height:8px;border-radius:99px;background:#9aa4b2}
.dvs-dot[data-status="running"]{background:#4f7cff;animation:dvsPulse 1.1s ease-in-out infinite}
.dvs-dot[data-status="done"]{background:#22c55e}
.dvs-dot[data-status="error"]{background:#ef4444}
@keyframes dvsPulse{0%,100%{opacity:1}50%{opacity:.35}}
.dvs-log{margin:0;max-height:190px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:11px;
  line-height:1.45;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;
  color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-empty{border:1px dashed var(--dsw-alias-border-l3,rgba(127,127,127,.35));border-radius:14px;padding:34px;
  text-align:center;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-dim{color:var(--dsw-alias-label-secondary,rgba(127,127,127,.95))}
.dvs-link{color:#6f97ff;text-decoration:none}
.dvs-link:hover{text-decoration:underline}
`;

		function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.getElementById("dsh-video-studio-css")) return;
			const style = document.createElement("style");
			style.id = "dsh-video-studio-css";
			style.dataset.plugin = "dsh-video-studio";
			style.textContent = CSS;
			document.head.append(style);
		}

		function formatDuration(seconds) {
			if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
			const total = Math.round(seconds);
			const minutes = Math.floor(total / 60);
			const rest = total % 60;
			return minutes > 0 ? minutes + "m " + rest + "s" : rest + "s";
		}

		function formatBytes(bytes) {
			if (!Number.isFinite(bytes) || bytes <= 0) return "";
			const mb = bytes / (1024 * 1024);
			return mb >= 1 ? mb.toFixed(1) + " MB" : Math.round(bytes / 1024) + " KB";
		}

		function slugify(value) {
			return String(value || "")
				.toLowerCase()
				.normalize("NFKD")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")
				.slice(0, 48) || "video-baru";
		}

		const FORMATS = {
			reel: { label: "Reel 9:16", size: "1080×1920" },
			landscape: { label: "YouTube 16:9", size: "1920×1080" },
			square: { label: "Square 1:1", size: "1080×1080" },
		};

		function buildPrompt({ topic, format, seconds, theme }) {
			const info = FORMATS[format] || FORMATS.reel;
			const slug = slugify(topic);
			return [
				"Buat video " + info.label + " berdurasi sekitar " + seconds + " detik tentang: " + (topic || "(topik belum diisi)") + ".",
				"Gaya visual: tema " + theme + ", tipografi besar dan bersih, caption pendek, transisi halus.",
				"",
				"Gunakan skill video-studio di workspace ini:",
				"1. Tulis spec JSON ke video-studio/projects/" + slug + "/video.json (jangan menulis komponen React baru).",
				"2. Jalankan: node video-studio/bin/video.mjs validate video-studio/projects/" + slug,
				"3. Cek 2 still dengan read_image, lalu perbaiki spec bila perlu.",
				"4. Render MP4 dan present hasilnya.",
				"",
				"Bahasa: Indonesia.",
			].join("\n");
		}

		function Icon({ size = 18 }) {
			return h(
				"svg",
				{
					width: size,
					height: size,
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.7,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": true,
				},
				h("rect", { x: 3, y: 4.5, width: 18, height: 15, rx: 2.5 }),
				h("path", { d: "M3 9h18M3 15h18" }),
				h("path", { d: "M8 4.5v15M16 4.5v15" }),
				h("path", { d: "M10.5 12.2l3.2 1.9-3.2 1.9z", fill: "currentColor", stroke: "none" }),
			);
		}

		function Sparkle({ size = 15 }) {
			return h(
				"svg",
				{
					width: size,
					height: size,
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.7,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": true,
				},
				h("path", { d: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" }),
				h("path", { d: "M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" }),
			);
		}

		function ProjectRow({ project, active, onSelect }) {
			return h(
				"button",
				{
					type: "button",
					className: "dvs-row",
					"data-active": active ? "true" : "false",
					onClick: () => onSelect(project.slug),
					title: project.slug,
				},
				h(
					"div",
					{className: "dvs-rowThumb"},
					project.cover
						? h("img", {
								src: project.cover + "?v=" + project.updatedAt,
								alt: "",
								loading: "lazy",
							})
						: h(Icon, {size: 20}),
				),
				h(
					"div",
					{className: "dvs-rowBody"},
					h("div", {className: "dvs-rowTitle"}, project.title || project.slug),
					h(
						"div",
						{className: "dvs-rowMeta"},
						formatDuration(project.seconds) +
							" · " +
							project.sceneCount +
							" scene · " +
							project.width +
							"×" +
							project.height,
					),
				),
			);
		}

		function PromptCard({ onSend, onCopy }) {
			const [topic, setTopic] = useState("");
			const [format, setFormat] = useState("reel");
			const [seconds, setSeconds] = useState(20);
			const [theme, setTheme] = useState("midnight");
			const prompt = buildPrompt({ topic, format, seconds, theme });

			return h(
				"section",
				{className: "dvs-card"},
				h(
					"div",
					{className: "dvs-promptHead"},
					h(Sparkle, {size: 16}),
					"Prompt cepat",
					h("span", {className: "dvs-dim"}, "— isi topik, lalu serahkan ke agent"),
				),
				h("textarea", {
					className: "dvs-field",
					value: topic,
					placeholder: "Contoh: cara kerja AI agent di DeepSeek Harness, untuk audiens developer",
					onChange: (event) => setTopic(event.target.value),
					spellCheck: false,
				}),
				h(
					"div",
					{className: "dvs-controls"},
					h(
						"select",
						{
							className: "dvs-select",
							value: format,
							onChange: (event) => setFormat(event.target.value),
							"aria-label": "Format",
						},
						Object.entries(FORMATS).map(([value, info]) =>
							h("option", {key: value, value}, info.label),
						),
					),
					h(
						"label",
						{className: "dvs-dim", style: {fontSize: 12}},
						"detik ",
						h("input", {
							className: "dvs-input",
							type: "number",
							min: 5,
							max: 120,
							value: seconds,
							onChange: (event) => setSeconds(Math.max(5, Math.min(120, Number(event.target.value) || 20))),
						}),
					),
					h(
						"select",
						{
							className: "dvs-select",
							value: theme,
							onChange: (event) => setTheme(event.target.value),
							"aria-label": "Tema",
						},
						["midnight", "sunset", "neon", "paper", "mono"].map((value) =>
							h("option", {key: value, value}, value),
						),
					),
					h("div", {className: "dvs-spacer"}),
					h(
						"button",
						{
							type: "button",
							className: "dvs-btn dvs-btn-ghost",
							onClick: () => onCopy(prompt),
							title: "Salin prompt ke clipboard",
						},
						"Salin",
					),
					h(
						"button",
						{
							type: "button",
							className: "dvs-btn dvs-btn-primary",
							onClick: () => onSend(prompt),
							disabled: topic.trim().length === 0,
						},
						h(Sparkle, {size: 15}),
						"Buat dengan agent",
					),
				),
			);
		}

		function Detail({ project, job, onRender, onDraft, onStudio, busy }) {
			if (!project) return null;
			const video = project.outputs.find((output) => output.kind === "video");
			const running = job && job.status === "running";
			return h(
				"section",
				{className: "dvs-card"},
				h(
					"div",
					{className: "dvs-detail"},
					h(
						"div",
						{className: "dvs-playerCol"},
						video
							? h("video", {
									key: video.url + video.mtime,
									className: "dvs-player",
									src: video.url + "?v=" + video.mtime,
									controls: true,
									playsInline: true,
									preload: "metadata",
									poster: project.cover ? project.cover + "?v=" + project.updatedAt : undefined,
								})
							: h("div", {className: "dvs-emptyPlayer"}, "Belum ada render untuk project ini"),
						h(
							"div",
							{className: "dvs-timeline"},
							(project.timeline || []).map((scene, index) =>
								h(
									"span",
									{
										key: index,
										className: "dvs-scene",
										title: scene.type + " · " + formatDuration(scene.seconds) + " · " + scene.label,
									},
									index + 1 + ". " + scene.type,
								),
							),
						),
					),
					h(
						"div",
						{className: "dvs-side"},
						h(
							"div",
							{style: {display: "flex", flexDirection: "column", gap: 2}},
							h(
								"div",
								{className: "dvs-metaRow"},
								h("span", null, "Project"),
								h("code", null, project.slug),
							),
							h(
								"div",
								{className: "dvs-metaRow"},
								h("span", null, "Durasi"),
								h("span", null, formatDuration(project.seconds) + " · " + project.sceneCount + " scene"),
							),
							h(
								"div",
								{className: "dvs-metaRow"},
								h("span", null, "Format"),
								h("span", null, project.width + "×" + project.height + " · " + project.fps + "fps"),
							),
							h(
								"div",
								{className: "dvs-metaRow"},
								h("span", null, "Output"),
								h(
									"span",
									null,
									video ? video.name + " · " + formatBytes(video.size) : "belum ada",
								),
							),
						),
						h(
							"div",
							{className: "dvs-actions"},
							h(
								"button",
								{
									type: "button",
									className: "dvs-btn dvs-btn-primary",
									onClick: onRender,
									disabled: busy || running,
								},
								running ? "Merender…" : "Render MP4",
							),
							h(
								"button",
								{
									type: "button",
									className: "dvs-btn",
									onClick: onDraft,
									disabled: busy || running,
									title: "Render 50% untuk review cepat",
								},
								"Draft 50%",
							),
							h(
								"button",
								{
									type: "button",
									className: "dvs-btn",
									onClick: onStudio,
									disabled: busy,
									title: "Buka Remotion Studio untuk scrub timeline",
								},
								"Studio",
							),
						),
						job
							? h(
									"div",
									{className: "dvs-job"},
									h(
										"div",
										{className: "dvs-jobHead"},
										h("span", {className: "dvs-dot", "data-status": job.status}),
										job.status === "running"
											? "Render berjalan"
											: job.status === "done"
												? "Render selesai"
												: "Render gagal",
										h("span", {className: "dvs-dim"}, "· " + (job.kind === "draft" ? "draft 50%" : "render penuh")),
									),
									h("pre", {className: "dvs-log"}, job.log || "…"),
								)
							: null,
					),
				),
			);
		}

		function VideoStudioPage(props) {
			const [state, setState] = useState(null);
			const [selected, setSelected] = useState(null);
			const [error, setError] = useState(null);
			const [notice, setNotice] = useState(null);
			const [busy, setBusy] = useState(false);
			const alive = useRef(true);

			const refresh = useCallback(async (silent) => {
				try {
					const next = await getState();
					if (!alive.current) return;
					setState(next);
					setError(next.error || null);
				} catch (caught) {
					if (!alive.current) return;
					if (!silent || !state) setError("Tidak bisa membaca studio: " + caught.message);
				}
			}, []);

			useEffect(() => {
				alive.current = true;
				refresh(true);
				const timer = setInterval(() => refresh(true), 3000);
				return () => {
					alive.current = false;
					clearInterval(timer);
				};
			}, [refresh]);

			useEffect(() => {
				if (!state) return;
				const exists = selected && state.projects.some((project) => project.slug === selected);
				if (!exists) setSelected(state.projects[0] ? state.projects[0].slug : null);
			}, [state, selected]);

			const project = state && selected ? state.projects.find((entry) => entry.slug === selected) : null;
			const job = state && selected ? state.jobs.find((entry) => entry.slug === selected) : null;

			const act = useCallback(
				async (action) => {
					if (!project) return;
					setBusy(true);
					setNotice(null);
					try {
						await action(project);
						await refresh(true);
					} catch (caught) {
						setNotice(caught.message);
					} finally {
						if (alive.current) setBusy(false);
					}
				},
				[project, refresh],
			);

			const onRender = () =>
				act(async (current) => {
					await postJson("/api/render", { slug: current.slug });
					setNotice("Render dimulai. Log muncul di bawah.");
				});
			const onDraft = () =>
				act(async (current) => {
					await postJson("/api/render", { slug: current.slug, draft: true });
					setNotice("Draft 50% dimulai.");
				});
			const onStudio = () =>
				act(async (current) => {
					const result = await postJson("/api/studio", { slug: current.slug });
					if (result.url) window.open(result.url, "_blank", "noopener");
					setNotice(result.starting ? "Studio sedang start: " + result.url : "Studio dibuka: " + result.url);
				});

			const copyPrompt = async (prompt) => {
				try {
					await navigator.clipboard.writeText(prompt);
					setNotice("Prompt disalin ke clipboard.");
				} catch {
					setNotice("Clipboard tidak tersedia. Prompt: " + prompt.slice(0, 120) + "…");
				}
			};

			const sendPrompt = (prompt) => {
				if (typeof props.startSession === "function") {
					props.startSession(prompt);
					setNotice("Prompt dibuka di sesi baru — tekan kirim untuk mulai.");
				} else {
					copyPrompt(prompt);
				}
			};

			const counts = useMemo(() => {
				const projects = state ? state.projects.length : 0;
				const renders = state
					? state.projects.reduce(
							(sum, entry) => sum + entry.outputs.filter((output) => output.kind === "video").length,
							0,
						)
					: 0;
				return { projects, renders };
			}, [state]);

			return h(
				"div",
				{className: "dvs-root"},
				h(
					"div",
					{className: "dvs-inner"},
					h(
						"header",
						{className: "dvs-head"},
						h(
							"div",
							null,
							h("h1", {className: "dvs-title"}, "Video Studio"),
							h(
								"p",
								{className: "dvs-sub"},
								"Prompt jadi video, preview, render, dan edit footage — " +
									counts.projects +
									" project, " +
									counts.renders +
									" file video.",
							),
						),
						h(
							"button",
							{
								type: "button",
								className: "dvs-btn",
								onClick: () => refresh(false),
								title: "Muat ulang daftar project",
							},
							"Refresh",
						),
					),
					error ? h("div", {className: "dvs-banner"}, error) : null,
					notice ? h("div", {className: "dvs-notice"}, notice) : null,
					h(PromptCard, { onSend: sendPrompt, onCopy: copyPrompt }),
					state && state.projects.length > 0
						? h(
								"div",
								{className: "dvs-main"},
								h(
									"aside",
									{className: "dvs-card", style: { padding: 12 }},
									h(
										"div",
										{className: "dvs-listHead"},
										h("span", null, "Projects"),
										h("span", null, state.projects.length),
									),
									h(
										"div",
										{className: "dvs-list"},
										state.projects.map((entry) =>
											h(ProjectRow, {
												key: entry.slug,
												project: entry,
												active: entry.slug === selected,
												onSelect: setSelected,
											}),
										),
									),
								),
								project
									? h(Detail, {
											project,
											job,
											busy,
											onRender,
											onDraft,
											onStudio,
										})
									: h("div", {className: "dvs-empty"}, "Pilih project untuk melihat preview."),
							)
						: h(
								"div",
								{className: "dvs-empty"},
								state ? "Belum ada project. Tulis prompt di atas untuk membuat video pertama." : "Memuat…",
							),
				),
			);
		}

		const inject = ["slots", "uiWorkspace"];

		function apply(ctx) {
			injectStyles();
			ctx.slots.inject("main", () =>
				ctx.slots.register(
					{
						name: "main",
						key: PANEL_ID,
						inject: () => ({
							startSession: (prompt) =>
								ctx.uiWorkspace.startSession(void 0, {
									prompt,
									whenDraftExists: "append",
								}),
						}),
					},
					VideoStudioPage,
				),
			);
			ctx.slots.inject("sidebar.panellist", () =>
				ctx.slots.register(
					{
						name: "sidebar.panellist",
						id: PANEL_ID,
						order: 20,
						label: "Video Studio",
					},
					Icon,
				),
			);
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
