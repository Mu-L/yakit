import React, {memo, useEffect, useMemo, useRef, useState} from "react"
import {useMemoizedFn} from "ahooks"
import {YakitButtonProp, YakitButton} from "@/components/yakitUI/YakitButton/YakitButton"
import {YakitCheckbox} from "@/components/yakitUI/YakitCheckbox/YakitCheckbox"
import {YakitHint} from "@/components/yakitUI/YakitHint/YakitHint"
import {Form, Tooltip} from "antd"
import {getRemoteValue, setRemoteValue} from "@/utils/kv"
import {RemotePluginGV} from "@/enums/plugin"
import {RemoteMenuGV} from "@/enums/menu"
import {isCommunityEdition} from "@/utils/envfile"
import {yakitNotify} from "@/utils/notification"
import {YakScript} from "@/pages/invoker/schema"
import {DatabaseFirstMenuProps} from "@/routes/newRoute"
import {YakitAutoComplete} from "@/components/yakitUI/YakitAutoComplete/YakitAutoComplete"
import {YakitInput} from "@/components/yakitUI/YakitInput/YakitInput"
import {YakitRoute} from "@/enums/yakitRoute"

import styles from "./HubExtraOperate.module.scss"

const {ipcRenderer} = window.require("electron")

interface HubButtonProps extends YakitButtonProp {
    /** 按钮文案 */
    name: string
    /** 父元素宽度 */
    width?: number
    /** 只展示icon的临界宽度 */
    iconWidth?: number
    /** icon的popover文案 */
    hint?: string
}
export const HubButton: React.FC<HubButtonProps> = memo((props) => {
    const {name, width, iconWidth, hint, className, disabled, ...rest} = props

    const isIcon = useMemo(() => {
        if (!width || !iconWidth) return false
        return width <= iconWidth
    }, [width, iconWidth])

    const tooltipHint = useMemo(() => {
        if (disabled) return hint || name || ""
        if (isIcon) return name || ""
        return ""
    }, [name, hint, disabled, isIcon])

    return (
        <Tooltip overlayClassName='plugins-tooltip' title={tooltipHint}>
            <YakitButton {...rest}>
                <span className={isIcon ? styles["hub-button-hidden"] : ""}>{name}</span>
            </YakitButton>
        </Tooltip>
    )
})

interface HubOperateHintProps {
    visible: boolean
    /** @param isCache 是否不再提示 */
    onOk: (isCache: boolean) => any
}
export const HubOperateHint: React.FC<HubOperateHintProps> = memo((props) => {
    const {visible, onOk} = props

    const [cache, setCache] = useState<boolean>(false)
    const handleOk = useMemoizedFn(() => {
        if (cache) setRemoteValue(RemotePluginGV.AutoDownloadPlugin, `true`)
        onOk(cache)
    })

    return (
        <YakitHint
            visible={visible}
            wrapClassName={styles["hub-operate-hint"]}
            title='该操作为本地功能'
            content={
                <>
                    <span className={styles["operate-style"]}>编辑、添加到菜单栏、移除菜单栏、导出</span>
                    <span className={styles["content-style"]}>均为本地操作，点击后会自动下载插件并进行对应操作</span>
                </>
            }
            okButtonText='好的'
            onOk={handleOk}
            cancelButtonProps={{style: {display: "none"}}}
            footerExtra={
                <YakitCheckbox value={cache} onChange={(e) => setCache(e.target.checked)}>
                    下次不再提醒
                </YakitCheckbox>
            }
        />
    )
})

interface DelPluginHintProps {
    /** 删除类型 online|local */
    type: string
    visible: boolean
    /** @param isCache 是否不再提示 */
    onCallback: (flag: boolean, isCache: boolean) => any
}
export const DelPluginHint: React.FC<DelPluginHintProps> = memo((props) => {
    const {type, visible, onCallback} = props

    const [cache, setCache] = useState<boolean>(false)
    const handleCallback = useMemoizedFn((flag: boolean) => {
        if (flag && cache) setRemoteValue(RemotePluginGV.DeletePluginHint, `true`)
        onCallback(flag, cache)
    })

    const title = useMemo(() => {
        if (type === "delLocal") return "确认删除后，插件将彻底删除"
        if (type === "delOnline") return "确认删除插件后，插件将会放在回收站"
        return "出现异常，请切换插件详情后重试"
    }, [type])

    return (
        <YakitHint
            visible={visible}
            title='是否要删除插件'
            content={title}
            okButtonProps={{disabled: !["delOnline", "delLocal"].includes(type)}}
            onOk={() => handleCallback(true)}
            onCancel={() => handleCallback(false)}
            footerExtra={
                <YakitCheckbox value={cache} onChange={(e) => setCache(e.target.checked)}>
                    下次不再提醒
                </YakitCheckbox>
            }
        />
    )
})

interface RemovePluginMenuContentProps {
    /** 插件名 */
    pluginName: string
}
/** @name 移出菜单(插件页面) */
export const RemovePluginMenuContent: React.FC<RemovePluginMenuContentProps> = memo((props) => {
    const {pluginName} = props

    const menuMode = useRef<"expert" | "new">("expert")
    const [groups, setGroups] = useState<string[]>([])

    useEffect(() => {
        updateGroups()
    }, [])

    const updateGroups = useMemoizedFn(async () => {
        if (!pluginName) {
            setGroups([])
            return
        }

        try {
            let mode = await getRemoteValue(RemoteMenuGV.PatternMenu)
            menuMode.current = mode || "expert"
        } catch (error) {}
        ipcRenderer
            .invoke("QueryNavigationGroups", {
                YakScriptName: pluginName,
                Mode: isCommunityEdition() ? RemoteMenuGV.CommunityMenuMode : menuMode.current
            })
            .then((data: {Groups: string[]}) => {
                setGroups(data.Groups || [])
            })
            .catch((e: any) => {
                setGroups([])
                yakitNotify("error", "获取菜单失败：" + e)
            })
    })
    const onClickRemove = useMemoizedFn((element: string) => {
        ipcRenderer
            .invoke("DeleteAllNavigation", {
                YakScriptName: pluginName,
                Group: element,
                Mode: isCommunityEdition() ? RemoteMenuGV.CommunityMenuMode : menuMode.current
            })
            .then(() => {
                if (isCommunityEdition()) ipcRenderer.invoke("refresh-public-menu")
                else ipcRenderer.invoke("change-main-menu")
                updateGroups()
            })
            .catch((e: any) => {
                yakitNotify("error", "移除菜单失败：" + e)
            })
    })
    return (
        <div className={styles["remove-plugin-menu-content"]}>
            {groups.length > 0
                ? groups.map((element) => {
                      return (
                          <YakitButton type='outline2' key={element} onClick={() => onClickRemove(element)}>
                              从 {element} 中移除
                          </YakitButton>
                      )
                  })
                : "暂无数据或插件未被添加到菜单栏"}
        </div>
    )
})

interface AddPluginMenuContentProps {
    /** 本地插件详情 */
    script: YakScript
    onCancel: () => any
}
export const AddPluginMenuContent: React.FC<AddPluginMenuContentProps> = (props) => {
    const {script, onCancel} = props

    const [form] = Form.useForm()

    const menuMode = useRef<"expert" | "new">("expert")
    const menus = useRef<DatabaseFirstMenuProps[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [option, setOption] = useState<{label: string; value: string}[]>([])

    useEffect(() => {
        if (!script) return
        form.setFieldsValue({
            Group: "",
            Verbose: script.ScriptName
        })
    }, [script])
    useEffect(() => {
        getRemoteValue(RemoteMenuGV.PatternMenu).then((patternMenu) => {
            menuMode.current = patternMenu || "expert"
            init()
        })
    }, [])

    /** 获取一级菜单 */
    const init = useMemoizedFn(() => {
        ipcRenderer
            .invoke("GetAllNavigationItem", {
                Mode: isCommunityEdition() ? RemoteMenuGV.CommunityMenuMode : menuMode.current
            })
            .then((rsp: {Data: DatabaseFirstMenuProps[]}) => {
                menus.current = rsp.Data
                setOption(rsp.Data.map((ele) => ({label: ele.Group, value: ele.Group})))
                form.setFieldsValue({
                    Group: rsp.Data[0]?.Group || "",
                    Verbose: script?.ScriptName || ""
                })
            })
            .catch((err) => {
                yakitNotify("error", "获取菜单失败：" + err)
            })
    })

    const onFinsh = useMemoizedFn((values: any) => {
        if (!script) {
            yakitNotify("error", "No Yak Modeule Selected")
            return
        }
        if (loading) return
        setLoading(true)

        const index = menus.current.findIndex((ele) => ele.Group === values.Group)
        const menusLength = menus.current.length
        let params: any = {}

        if (index === -1) {
            if (menusLength >= 50) {
                yakitNotify("error", "最多添加50个一级菜单")
                return
            }
            params = {
                YakScriptName: script.ScriptName,
                Verbose: values.Verbose,
                VerboseLabel: script.ScriptName,
                Group: values.Group,
                GroupLabel: values.Group,
                Mode: isCommunityEdition() ? RemoteMenuGV.CommunityMenuMode : menuMode.current,
                VerboseSort: 1,
                GroupSort: menusLength + 1,
                Route: YakitRoute.Plugin_OP
            }
        } else {
            const groupInfo = menus.current[index]
            if (groupInfo.Items.length >= 50) {
                yakitNotify("error", "同一个一级菜单最多添加50个二级菜单")
                return
            }
            params = {
                YakScriptName: script.ScriptName,
                Verbose: values.Verbose,
                VerboseLabel: script.ScriptName,
                Group: groupInfo.Group,
                GroupLabel: groupInfo.GroupLabel,
                Mode: isCommunityEdition() ? RemoteMenuGV.CommunityMenuMode : menuMode.current,
                VerboseSort: 0,
                GroupSort: groupInfo.GroupSort,
                Route: YakitRoute.Plugin_OP
            }
            const subIndex = groupInfo.Items.findIndex((ele) => ele.Verbose === values.Verbose)
            params.VerboseSort =
                subIndex === -1 ? groupInfo.Items.length + 1 : groupInfo.Items[subIndex].VerboseSort || 0
        }

        ipcRenderer
            .invoke("AddOneNavigation", params)
            .then(() => {
                if (isCommunityEdition()) ipcRenderer.invoke("refresh-public-menu")
                else ipcRenderer.invoke("change-main-menu")
                yakitNotify("success", "添加成功")
                onCancel()
            })
            .catch((e: any) => {
                yakitNotify("error", `${e}`)
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false)
                }, 200)
            })
    })

    return (
        <div className={styles["add-plugin-menu-content"]}>
            <Form form={form} layout='vertical' onFinish={onFinsh}>
                <Form.Item
                    label={"菜单选项名(展示名称)"}
                    name='Verbose'
                    rules={[{required: true, message: "该项为必填"}]}
                >
                    <YakitInput />
                </Form.Item>
                <Form.Item label={"菜单分组"} name='Group' rules={[{required: true, message: "该项为必填"}]}>
                    <YakitAutoComplete options={option} />
                </Form.Item>
                <div className={styles["form-btn-group"]}>
                    <Form.Item colon={false} noStyle>
                        <YakitButton type='outline1' onClick={onCancel}>
                            取消
                        </YakitButton>
                    </Form.Item>
                    <Form.Item colon={false} noStyle>
                        <YakitButton type='primary' htmlType='submit' loading={loading}>
                            添加
                        </YakitButton>
                    </Form.Item>
                </div>
            </Form>
        </div>
    )
}
