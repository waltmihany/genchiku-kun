from pathlib import Path

root = Path('/home/user/genchiku-kun-v3')
app = root / 'src/App.jsx'
core = root / 'src/legacy/gameCore.js'
legacy_html = root / 'src/legacy/appShellHtml.js'

app_text = app.read_text()
app_text = app_text.replace('  runReportOpenBudget,\n  runTitleStartGame,\n  runReportSelectEntry,\n  runResultRestart,\n', '  runReportOpenBudget,\n  runRestartFromTopbar,\n  runTitleStartGame,\n  runReportSelectEntry,\n  runResultRestart,\n')
app_text = app_text.replace('import { legacyTemplatesHtml } from "./legacy/appShellHtml";\n', '')
app_text = app_text.replace('<button id="restartTopBtn" className="ghost-btn">はじめから</button>', '<button id="restartTopBtn" className="ghost-btn" onClick={runRestartFromTopbar}>はじめから</button>')
old_hidden = '''\n      <div\n        aria-hidden="true"\n        style={{ display: "none" }}\n        dangerouslySetInnerHTML={{ __html: legacyTemplatesHtml }}\n      />'''
app_text = app_text.replace(old_hidden, '')
app.write_text(app_text)

core_text = core.read_text()
core_text = core_text.replace('export function runTitleStartGame() {\n  gameState.screen = "dashboard";\n  render();\n}\n', 'export function runTitleStartGame() {\n  gameState.screen = "dashboard";\n  render();\n}\n\nexport function runRestartFromTopbar() {\n  resetGame(false);\n}\n')

old_render = '''function render() {\n  if (!appRoot) return;\n  const container = getElement("screenContainer");\n  if (!container) return;\n\n  emitGameViewChange();\n\n  if (REACT_MANAGED_SCREENS.has(gameState.screen)) {\n    container.innerHTML = "";\n    const mountId = getReactManagedMountId(gameState.screen);\n    if (mountId && getElement(mountId)) {\n      flushReactManagedScreen();\n    }\n    return;\n  }\n\n  container.innerHTML = "";\n\n  if (gameState.screen === "title") {\n    renderTemplate(container, "titleTemplate");\n    getElement("startGameBtn").addEventListener("click", () => {\n      gameState.screen = "dashboard";\n      render();\n    });\n  } else if (gameState.screen === "event") {\n    renderTemplate(container, "eventTemplate");\n    renderEvent();\n  } else if (gameState.screen === "gameover" || gameState.screen === "clear") {\n    renderTemplate(container, "resultTemplate");\n    renderResult();\n  }\n\n  bindTopButtons();\n  renderOnboardingOverlay();\n}\n\nfunction renderTemplate(container, templateId) {\n  const node = getElement(templateId).content.cloneNode(true);\n  container.appendChild(node);\n}\n\nfunction bindTopButtons() {\n  const topBtn = getElement("restartTopBtn");\n  if (topBtn) topBtn.onclick = () => resetGame(false);\n  const restartBtn = getElement("restartResultBtn");\n  if (restartBtn) restartBtn.onclick = () => resetGame(true);\n  const reviewBtn = getElement("reviewResultBtn");\n  if (reviewBtn) reviewBtn.onclick = () => {\n    gameState.screen = "report";\n    render();\n  };\n}\n\nexport function flushReactManagedScreen() {\n  if (!appRoot || !REACT_MANAGED_SCREENS.has(gameState?.screen)) return;\n  if (gameState.screen === "dashboard") {\n    renderDashboard();\n  } else if (gameState.screen === "budget") {\n    renderBudget();\n  } else if (gameState.screen === "report") {\n    renderReport();\n  }\n  bindTopButtons();\n  renderOnboardingOverlay();\n}\n'''
new_render = '''function render() {\n  if (!appRoot) return;\n  const container = getElement("screenContainer");\n  if (!container) return;\n\n  emitGameViewChange();\n\n  container.innerHTML = "";\n\n  if (REACT_MANAGED_SCREENS.has(gameState.screen)) {\n    const mountId = getReactManagedMountId(gameState.screen);\n    if (mountId && getElement(mountId)) {\n      flushReactManagedScreen();\n    } else {\n      renderOnboardingOverlay();\n    }\n    return;\n  }\n\n  renderOnboardingOverlay();\n}\n\nexport function flushReactManagedScreen() {\n  if (!appRoot || !REACT_MANAGED_SCREENS.has(gameState?.screen)) return;\n  if (gameState.screen === "dashboard") {\n    renderDashboard();\n  } else if (gameState.screen === "budget") {\n    renderBudget();\n  } else if (gameState.screen === "report") {\n    renderReport();\n  }\n  renderOnboardingOverlay();\n}\n'''
if old_render not in core_text:
    raise SystemExit('old render block not found')
core_text = core_text.replace(old_render, new_render)

for start_marker in ['function renderEvent() {', 'function renderResult() {']:
    start = core_text.find(start_marker)
    if start == -1:
        raise SystemExit(f'{start_marker} not found')
    brace = 0
    end = None
    for i in range(start, len(core_text)):
        ch = core_text[i]
        if ch == '{':
            brace += 1
        elif ch == '}':
            brace -= 1
            if brace == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit(f'could not parse {start_marker}')
    core_text = core_text[:start] + core_text[end:] + '\n'

core.write_text(core_text)

if legacy_html.exists():
    legacy_html.unlink()

print('B-4 cleanup applied')
