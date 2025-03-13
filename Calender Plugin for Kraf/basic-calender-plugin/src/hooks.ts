import { KulpService } from 'kulp-kit';
export function registerHooks(kulp: KulpService) {
    kulp.addHook("onInit", async () => {
        console.log("Plugin loaded")
        const settings = kulp.getPluginSettings();
        console.log("Plugin settings: ", settings)
    })
} 