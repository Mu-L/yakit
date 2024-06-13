import {YakScript} from "@/pages/invoker/schema"
import {yakitNotify} from "@/utils/notification"
import {APIFunc} from "./apiType"

const {ipcRenderer} = window.require("electron")

/**
 * @name 获取指定插件的详情(本地)
 */
export const grpcDownloadOnlinePlugin: APIFunc<{uuid: string; token?: string}, YakScript> = (params, hiddenError) => {
    return new Promise((resolve, reject) => {
        ipcRenderer
            .invoke("DownloadOnlinePluginByUUID", {UUID: params.uuid, Token: params.token || undefined})
            .then(resolve)
            .catch((e) => {
                if (!hiddenError) yakitNotify("error", "下载插件失败:" + e)
                reject(e)
            })
    })
}
