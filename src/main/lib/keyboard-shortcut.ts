import { BrowserWindow, globalShortcut } from 'electron'
import { ProcessingManager } from './processing-manager'
import { configManager } from './config-manager'
export interface IKeyboardShortcutHelper {
  moveWindowLeft: () => void
  moveWindowRight: () => void
  moveWindowUp: () => void
  moveWindowDown: () => void
  toggleMainWindow: () => void
  isVisible: () => boolean
  getMainWindow: () => BrowserWindow | null
  takeScreenshot: () => Promise<string>
  getImagePreview: (filePath: string) => Promise<string>
  clearQueues: () => void
  setView: (view: 'queue' | 'solutions' | 'debug') => void
  processingManager: ProcessingManager | null
}

export class KeyboardShortcutHelper {
  private deps: IKeyboardShortcutHelper

  constructor(deps: IKeyboardShortcutHelper) {
    this.deps = deps
  }

  private adjustOpacity(delta: number): void {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return

    const currentOpacity = mainWindow.getOpacity()
    const newOpacity = Math.max(0.1, Math.min(1, currentOpacity + delta))
    console.log('adjusting opacity', currentOpacity, newOpacity)
    mainWindow.setOpacity(newOpacity)

    try {
      const config = configManager.loadConfig()
      config.opacity = newOpacity
      configManager.saveConfig(config)
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  public registerGlobalShortcuts(): void {
    globalShortcut.register('CommandOrControl+Left', () => {
      console.log('moveWindowLeft')
      this.deps.moveWindowLeft()
    })
    globalShortcut.register('CommandOrControl+Right', () => {
      console.log('moveWindowRight')
      this.deps.moveWindowRight()
    })
    globalShortcut.register('CommandOrControl+Up', () => {
      console.log('moveWindowUp')
      this.deps.moveWindowUp()
    })
    globalShortcut.register('CommandOrControl+Down', () => {
      console.log('moveWindowDown')
      this.deps.moveWindowDown()
    })
    globalShortcut.register('CommandOrControl+B', () => {
      console.log('toggleMainWindow')
      this.deps.toggleMainWindow()
    })
    globalShortcut.register('CommandOrControl+H', async () => {
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        console.log('taking screenshot')
        try {
          const screenshotPath = await this.deps.takeScreenshot()
          const preview = await this.deps.getImagePreview(screenshotPath)
          console.log('screenshot taken', screenshotPath, preview)
          mainWindow.webContents.send('screenshot-taken', {
            path: screenshotPath,
            preview
          })
        } catch (error) {
          console.error('Failed to take screenshot:', error)
        }
      }
    })
    globalShortcut.register('CommandOrControl+L', async () => {
      console.log('deleteLastScreenshot')
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send('screenshot-deleted')
      }
    })
    globalShortcut.register('CommandOrControl+Enter', async () => {
      await this.deps.processingManager?.processScreenshots()
    })
    globalShortcut.register('CommandOrControl+[', () => {
      console.log('decreaseOpacity')
      this.adjustOpacity(-0.1)
    })
    globalShortcut.register('CommandOrControl+]', () => {
      console.log('increaseOpacity')
      this.adjustOpacity(0.1)
    })
  }
}
