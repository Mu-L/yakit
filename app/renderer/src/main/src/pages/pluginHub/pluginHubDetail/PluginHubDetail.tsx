import React, {ForwardedRef, forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react"
import {useMemoizedFn} from "ahooks"
import PluginTabs from "@/components/businessUI/PluginTabs/PluginTabs"
import {apiFetchLocalPluginInfo, apiFetchOnlinePluginInfo} from "@/pages/plugins/utils"
import {API} from "@/services/swagger/resposeType"
import {YakScript} from "@/pages/invoker/schema"
import {YakitSpin} from "@/components/yakitUI/YakitSpin/YakitSpin"
import {YakitEmpty} from "@/components/yakitUI/YakitEmpty/YakitEmpty"
import {YakitButton} from "@/components/yakitUI/YakitButton/YakitButton"
import {OutlineRefreshIcon, OutlineReplyIcon} from "@/assets/icon/outline"
import {PluginDetailHeader} from "@/pages/plugins/baseTemplate"
import {YakitEditor} from "@/components/yakitUI/YakitEditor/YakitEditor"
import {PluginLogs} from "@/pages/plugins/log/PluginLog"
import {yakitNotify} from "@/utils/notification"
import {Tooltip} from "antd"
import {SolidPluscircleIcon} from "@/assets/icon/solid"
import {HubExtraOperate, HubExtraOperateRef} from "../hubExtraOperate/HubExtraOperate"
import {v4 as uuidv4} from "uuid"
import {grpcDownloadOnlinePlugin} from "../utils/grpc"

import classNames from "classnames"
import styles from "./PluginHubDetail.module.scss"
import emiter from "@/utils/eventBus/eventBus"
import {YakitRoute} from "@/enums/yakitRoute"
import {PluginSourceType, PluginToDetailInfo} from "../type"

const {TabPane} = PluginTabs

/**
 * @description 该组件在yakit中只能出现一次，否则元素id将会重复
 */
const wrapperId = `plugin-hub-detail${uuidv4()}`

/**
 * @description 被禁用的tab页提示文案
 */
const BanOnlineHint = "请上传后在使用"
const BanLocalHint = "请下载后在使用"

export interface PluginHubDetailRefProps {
    /** 设置需要展示的插件详情 */
    handleSetPlugin: (info: PluginToDetailInfo) => any
    /** 清除正在展示的插件详情 */
    handleClearPlugin: () => any
}

interface PluginHubDetailProps {
    ref?: ForwardedRef<PluginHubDetailRefProps>
}

export const PluginHubDetail: React.FC<PluginHubDetailProps> = memo(
    forwardRef((props, ref) => {
        const {} = props

        /** ---------- 基础全局功能 Start ---------- */
        // 新建插件(OK)
        const onNewPlugin = useMemoizedFn(() => {
            emiter.emit(
                "openPage",
                JSON.stringify({route: YakitRoute.AddYakitScript, params: {source: YakitRoute.NewHome}})
            )
        })
        // 返回列表
        const onBack = useMemoizedFn(() => {})
        /** ---------- 基础全局功能 End ---------- */

        const [activeKey, setActiveKey] = useState("online")
        const onTabChange = useMemoizedFn((key: string) => {
            setActiveKey(key)
        })

        /** ---------- 意外情况的错误信息展示 Start ---------- */
        // 是否显示错误页面
        const [isError, setIsError] = useState<boolean>(false)
        // 是否显示错误页面上的刷新按钮
        const isRefresh = useRef<boolean>(false)
        // 错误页面的提示信息
        const errorInfo = useRef<string>("")
        const onError = useMemoizedFn((flag: boolean, refresh?: boolean, hint?: string) => {
            errorInfo.current = hint || ""
            isRefresh.current = !!refresh
            setIsError(flag)
        })
        // 刷新
        const onRefresh = useMemoizedFn(() => {
            onFetchPlugin()
        })
        /** ---------- 意外情况的错误信息展示 End ---------- */

        const [loading, setLoading] = useState<boolean>(false)
        const currentRequest = useRef<PluginToDetailInfo | undefined>({
            type: "online",
            name: "六零导航页 file.php 任意文件上传漏洞",
            uuid: "5f1b76c1-3e37-40d8-ac5f-014e83e9d06b"
        })
        const [onlinePlugin, setOnlinePlugin] = useState<API.PluginsDetail | undefined>()
        const hasOnline = useMemo(() => !!onlinePlugin, [onlinePlugin])
        const [localPlugin, setLocalPlugin] = useState<YakScript | undefined>()
        const hasLocal = useMemo(() => !!localPlugin, [localPlugin])

        useEffect(() => {
            onFetchPlugin()
        }, [])

        /** ---------- 获取插件信息逻辑 Start ---------- */
        const handleSetPlugin = useMemoizedFn((info: PluginToDetailInfo) => {
            if (!info.name && !info.uuid) {
                yakitNotify("error", "未获取到插件的关键信息，请重试!")
                return
            }
            currentRequest.current = {...info}
            onFetchPlugin()
        })

        // 获取插件线上信息
        const fetchOnlinePlugin: () => Promise<API.PluginsDetail> = useMemoizedFn(() => {
            return new Promise((resolve, reject) => {
                if (!currentRequest.current || !currentRequest.current.uuid) return reject("false")
                apiFetchOnlinePluginInfo(currentRequest.current.uuid).then(resolve).catch(reject)
            })
        })
        // 获取插件本地信息
        const fetchLocalPlugin: () => Promise<YakScript> = useMemoizedFn(() => {
            return new Promise((resolve, reject) => {
                if (!currentRequest.current || !currentRequest.current.name) return reject("false")
                apiFetchLocalPluginInfo(currentRequest.current.name, false).then(resolve).catch(reject)
            })
        })

        const onFetchPlugin = useMemoizedFn(() => {
            if (!currentRequest.current) {
                onError(true, false, "插件请求信息异常，请重新选择插件!")
                return
            }
            const {name, uuid} = currentRequest.current
            if (!name && !uuid) {
                onError(true, false, "未获取到插件的关键信息，请重新选择插件!")
                return
            }

            setLoading(true)
            const promises: Promise<any>[] = [fetchOnlinePlugin(), fetchLocalPlugin()]

            Promise.allSettled(promises)
                .then((res) => {
                    if (name !== currentRequest.current?.name) return
                    const [online, local] = res
                    let activeTab = ""

                    if (online.status === "fulfilled") {
                        activeTab = "online"
                        setOnlinePlugin({...online.value})
                    }
                    if (online.status === "rejected") {
                        setOnlinePlugin(undefined)
                        const {reason} = online as PromiseRejectedResult
                        if (reason !== "false") yakitNotify("error", `获取线上插件错误: ${reason}`)
                    }

                    if (local.status === "fulfilled") {
                        if (!activeTab) activeTab = "exectue"
                        setLocalPlugin({...local.value})
                    }
                    if (local.status === "rejected") {
                        setLocalPlugin(undefined)
                        const {reason} = local as PromiseRejectedResult
                        if (reason !== "false") yakitNotify("error", `获取本地插件错误: ${reason}`)
                    }

                    if (activeTab) {
                        setActiveKey(activeTab)
                        onError(false)
                    } else {
                        onError(true, true, "未获取到插件信息，请刷新重试!")
                    }
                })
                .catch((err) => {
                    onError(true, true, `获取信息异常，请刷新重试\n${err}`)
                })
                .finally(() => {
                    if (name !== currentRequest.current?.name) return
                    setTimeout(() => {
                        setLoading(false)
                    }, 200)
                })
        })
        /** ---------- 获取插件信息逻辑 End ---------- */

        /** ---------- 插件操作逻辑 Start ---------- */
        const operateRef = useRef<HubExtraOperateRef>(null)
        /** 防止下载过长导致用户切换插件的问题 */
        const currentDownloadUUID = useRef<string>("")
        const [downloadLoading, setDownloadLoading] = useState<boolean>(false)
        // 下载插件
        const onDownload = useMemoizedFn(() => {
            if (!onlinePlugin) {
                if (operateRef && operateRef.current) operateRef.current.downloadedNext(false)
                return
            }
            if (downloadLoading) return
            setDownloadLoading(true)

            let flag: boolean = false
            currentDownloadUUID.current = onlinePlugin.uuid
            grpcDownloadOnlinePlugin({uuid: onlinePlugin.uuid})
                .then((res) => {
                    if (currentDownloadUUID.current && onlinePlugin.uuid !== currentDownloadUUID.current) return
                    setLocalPlugin({...res})
                    flag = true
                })
                .catch((err) => {
                    if (currentDownloadUUID.current && onlinePlugin.uuid !== currentDownloadUUID.current) return
                    yakitNotify("error", `下载插件失败: ${err}`)
                    flag = false
                })
                .finally(() => {
                    if (currentDownloadUUID.current && onlinePlugin.uuid !== currentDownloadUUID.current) return
                    currentDownloadUUID.current = ""
                    setTimeout(() => {
                        if (operateRef && operateRef.current) operateRef.current.downloadedNext(flag)
                        setDownloadLoading(false)
                    }, 200)
                })
        })

        /** ---------- 插件操作逻辑 End ---------- */

        useImperativeHandle(
            ref,
            () => ({
                handleSetPlugin: handleSetPlugin,
                handleClearPlugin: () => {
                    console.log("handleClearPlugin")
                }
            }),
            []
        )

        const bar = (props: any, TabBarDefault: any) => {
            return (
                <TabBarDefault
                    {...props}
                    children={(barNode: React.ReactElement) => {
                        const {
                            key,
                            props: {className}
                        } = barNode

                        if (!key) return barNode

                        try {
                            const isDisable = className.indexOf("disabled") > -1
                            if (!isDisable) return barNode

                            let hint = ""
                            if (["online", "comment", "log"].includes(key as string)) hint = BanOnlineHint
                            else hint = BanLocalHint

                            return (
                                <Tooltip overlayStyle={{paddingRight: 4}} placement='left' title={hint}>
                                    {barNode}
                                </Tooltip>
                            )
                        } catch (error) {
                            return barNode
                        }
                    }}
                />
            )
        }

        return (
            <div
                id={wrapperId}
                className={classNames(styles["plugin-hub-detail"], {[styles["plugin-hub-detail-error"]]: isError})}
            >
                <div className={styles["detail-header"]}>
                    <div className={styles["header-title"]}>插件详情</div>
                    <div className={styles["header-btn"]}>
                        <YakitButton size='large' icon={<SolidPluscircleIcon />} onClick={onNewPlugin}>
                            新建插件
                        </YakitButton>
                        <YakitButton size='large' type='outline2' icon={<OutlineReplyIcon />} onClick={onBack}>
                            返回
                        </YakitButton>
                    </div>
                </div>

                <div className={styles["detail-body"]}>
                    <YakitSpin spinning={loading} tip='获取插件中...'>
                        <PluginTabs
                            wrapperClassName={styles["plugin-hub-container"]}
                            tabPosition='right'
                            activeKey={activeKey}
                            onChange={onTabChange}
                            renderTabBar={bar}
                        >
                            <TabPane tab='线上' key='online' disabled={!hasOnline}>
                                <div className={styles["tab-pane-wrapper"]}>
                                    <PluginDetailHeader
                                        pluginName={onlinePlugin?.script_name || "-"}
                                        help={onlinePlugin?.help || "-"}
                                        tags={onlinePlugin?.tags || ""}
                                        extraNode={
                                            <>
                                                <HubExtraOperate
                                                    ref={operateRef}
                                                    getContainer={wrapperId}
                                                    online={onlinePlugin}
                                                    local={localPlugin}
                                                    onDownload={onDownload}
                                                    onCallback={() => {}}
                                                />
                                                {/* <OnlineExtraOperate
                                                data={plugin}
                                                isLogin={userInfo.isLogin}
                                                dispatch={dispatch}
                                                likeProps={{
                                                    active: plugin.is_stars,
                                                    likeNumber: plugin.starsCountString || "",
                                                    onLikeClick: onLikeClick
                                                }}
                                                commentProps={{
                                                    commentNumber: plugin.commentCountString || ""
                                                    // onCommentClick: onCommentClick
                                                }}
                                                downloadProps={{
                                                    downloadNumber: plugin.downloadedTotalString || "",
                                                    onDownloadClick: onDownloadClick
                                                }}
                                            />
                                            <FuncBtn
                                                maxWidth={1100}
                                                icon={<OutlineCursorclickIcon />}
                                                name={"去使用"}
                                                onClick={onUse}
                                            /> */}
                                            </>
                                        }
                                        img={onlinePlugin?.head_img || ""}
                                        user={onlinePlugin?.authors || "-"}
                                        pluginId={onlinePlugin?.uuid || "-"}
                                        updated_at={onlinePlugin?.updated_at || 0}
                                        prImgs={(onlinePlugin?.collaborator || []).map((ele) => ({
                                            headImg: ele.head_img,
                                            userName: ele.user_name
                                        }))}
                                        type={onlinePlugin?.type || "yak"}
                                    />
                                    <div className={styles["detail-content"]}>
                                        <YakitEditor
                                            type={onlinePlugin?.type || "plaintext"}
                                            value={onlinePlugin?.content || ""}
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </TabPane>
                            <TabPane tab='执行' key='exectue' disabled={!hasLocal}>
                                <div className={styles["plugin-comment-wrapper"]}></div>
                            </TabPane>
                            <TabPane tab='本地' key='local' disabled={!hasLocal}>
                                <div className={styles["tab-pane-wrapper"]}>
                                    <PluginDetailHeader
                                        pluginName={localPlugin?.ScriptName || "-"}
                                        help={localPlugin?.Help}
                                        tags={localPlugin?.Tags}
                                        extraNode={null}
                                        img={localPlugin?.HeadImg || ""}
                                        user={localPlugin?.Author || "-"}
                                        pluginId={localPlugin?.UUID || "-"}
                                        updated_at={localPlugin?.UpdatedAt || 0}
                                        prImgs={(localPlugin?.CollaboratorInfo || []).map((ele) => ({
                                            headImg: ele.HeadImg,
                                            userName: ele.UserName
                                        }))}
                                        type={localPlugin?.Type || "plaintext"}
                                    />
                                    <div className={styles["detail-content"]}>
                                        <YakitEditor
                                            type={localPlugin?.Type || "yak"}
                                            value={localPlugin?.Content || ""}
                                            readOnly={true}
                                        />
                                    </div>
                                </div>
                            </TabPane>
                            <TabPane tab='评论' key='comment' disabled={!hasOnline}>
                                <div className={styles["tab-pane-wrapper"]}>
                                    <PluginDetailHeader
                                        pluginName={onlinePlugin?.script_name || "-"}
                                        help={onlinePlugin?.help || "-"}
                                        tags={onlinePlugin?.tags || ""}
                                        extraNode={
                                            <div className={styles["plugin-info-extra-header"]}>
                                                {/* <OnlineExtraOperate
                                                data={plugin}
                                                isLogin={userInfo.isLogin}
                                                dispatch={dispatch}
                                                likeProps={{
                                                    active: plugin.is_stars,
                                                    likeNumber: plugin.starsCountString || "",
                                                    onLikeClick: onLikeClick
                                                }}
                                                commentProps={{
                                                    commentNumber: plugin.commentCountString || ""
                                                    // onCommentClick: onCommentClick
                                                }}
                                                downloadProps={{
                                                    downloadNumber: plugin.downloadedTotalString || "",
                                                    onDownloadClick: onDownloadClick
                                                }}
                                            />
                                            <FuncBtn
                                                maxWidth={1100}
                                                icon={<OutlineCursorclickIcon />}
                                                name={"去使用"}
                                                onClick={onUse}
                                            /> */}
                                            </div>
                                        }
                                        img={onlinePlugin?.head_img || ""}
                                        user={onlinePlugin?.authors || "-"}
                                        pluginId={onlinePlugin?.uuid || "-"}
                                        updated_at={onlinePlugin?.updated_at || 0}
                                        prImgs={(onlinePlugin?.collaborator || []).map((ele) => ({
                                            headImg: ele.head_img,
                                            userName: ele.user_name
                                        }))}
                                        type={onlinePlugin?.type || "yak"}
                                    />
                                    {/* <PluginComment isLogin={userInfo.isLogin} plugin={{...plugin}} /> */}
                                </div>
                            </TabPane>
                            <TabPane tab='日志' key='log' disabled={!hasOnline}>
                                <div className={styles["tab-pane-wrapper"]}>
                                    <PluginDetailHeader
                                        pluginName={onlinePlugin?.script_name || "-"}
                                        help={onlinePlugin?.help || "-"}
                                        tags={onlinePlugin?.tags || ""}
                                        extraNode={
                                            <div className={styles["plugin-info-extra-header"]}>
                                                {/* <OnlineExtraOperate
                                                data={plugin}
                                                isLogin={userInfo.isLogin}
                                                dispatch={dispatch}
                                                likeProps={{
                                                    active: plugin.is_stars,
                                                    likeNumber: plugin.starsCountString || "",
                                                    onLikeClick: onLikeClick
                                                }}
                                                commentProps={{
                                                    commentNumber: plugin.commentCountString || ""
                                                    // onCommentClick: onCommentClick
                                                }}
                                                downloadProps={{
                                                    downloadNumber: plugin.downloadedTotalString || "",
                                                    onDownloadClick: onDownloadClick
                                                }}
                                            />
                                            <FuncBtn
                                                maxWidth={1100}
                                                icon={<OutlineCursorclickIcon />}
                                                name={"去使用"}
                                                onClick={onUse}
                                            /> */}
                                            </div>
                                        }
                                        img={onlinePlugin?.head_img || ""}
                                        user={onlinePlugin?.authors || "-"}
                                        pluginId={onlinePlugin?.uuid || "-"}
                                        updated_at={onlinePlugin?.updated_at || 0}
                                        prImgs={(onlinePlugin?.collaborator || []).map((ele) => ({
                                            headImg: ele.head_img,
                                            userName: ele.user_name
                                        }))}
                                        type={onlinePlugin?.type || "yak"}
                                    />
                                    <PluginLogs uuid={onlinePlugin?.uuid || ""} getContainer={wrapperId} />
                                </div>
                            </TabPane>
                        </PluginTabs>

                        <div className={styles["plugin-hub-detail-empty"]}>
                            <YakitEmpty
                                title={errorInfo.current || "未获取到插件信息"}
                                titleClassName={styles["hint-style"]}
                            />
                            {isRefresh.current && (
                                <div className={styles["refresh-buttons"]}>
                                    <YakitButton type='outline1' icon={<OutlineRefreshIcon />} onClick={onRefresh}>
                                        刷新
                                    </YakitButton>
                                </div>
                            )}
                        </div>
                    </YakitSpin>
                </div>
            </div>
        )
    })
)
