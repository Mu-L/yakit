import {ReactNode} from "react"
import {PluginSourceType} from "./type"
import {
    OutlineLocalPluginIcon,
    OutlineOnlinePluginIcon,
    OutlineOwnPluginIcon,
    OutlineTrashSecondIcon
    } from "@/assets/icon/outline"
import {ExportParamsProps} from "../plugins/local/PluginsLocalType"

export const HubSideBarList: {key: PluginSourceType; title: string; icon: ReactNode}[] = [
    {key: "online", title: "插件商店", icon: <OutlineOnlinePluginIcon />},
    {key: "own", title: "我的", icon: <OutlineOwnPluginIcon />},
    {key: "local", title: "本地", icon: <OutlineLocalPluginIcon />},
    {key: "recycle", title: "回收站", icon: <OutlineTrashSecondIcon />}
]

/** @name 插件导出-默认参数 */
export const DefaultExportRequest: ExportParamsProps = {
    OutputDir: "",
    YakScriptIds: [],
    Keywords: "",
    Type: "",
    UserName: "",
    Tags: ""
}
