import React, {useEffect, useImperativeHandle, useRef, useState} from "react"
import {SolidFolderopenIcon, SolidQuestionmarkcircleIcon, SolidViewgridIcon} from "@/assets/icon/solid"
import {PluginGroupList} from "./PluginGroupList"
import {YakitButton} from "@/components/yakitUI/YakitButton/YakitButton"
import {OutlinePencilaltIcon, OutlineTrashIcon} from "@/assets/icon/outline"
import {getRemoteValue, setRemoteValue} from "@/utils/kv"
import {RemoteGV} from "@/yakitGV"
import {DelGroupConfirmPop} from "./PluginOnlineGroupList"

const testGroupList = [
    {
        groupName: "全部",
        pluginNumer: 111,
        showOptBtns: false,
        icon: <SolidViewgridIcon />,
        iconColor: "#56c991"
    },
    {
        groupName: "未分组",
        pluginNumer: 222,
        showOptBtns: false,
        icon: <SolidQuestionmarkcircleIcon />,
        iconColor: "#8863f7"
    },
    {
        groupName: "test3",
        pluginNumer: 2,
        showOptBtns: true,
        icon: <SolidFolderopenIcon />,
        iconColor: "var(--yakit-primary-5)"
    },
    {
        groupName: "test4",
        pluginNumer: 3,
        showOptBtns: true,
        icon: <SolidFolderopenIcon />,
        iconColor: "var(--yakit-primary-5)"
    }
]

interface PluginLocalGroupListProps {
    ref: React.Ref<any>
}
export const PluginLocalGroupList: React.FC<PluginLocalGroupListProps> = React.forwardRef((props, ref) => {
    const [groupList, setGroupList] = useState<any>(testGroupList)
    const [editGroup, setEditGroup] = useState<any>({}) // 编辑插件组
    const [delGroup, setDelGroup] = useState<any>({}) // 删除插件组

    const [delGroupConfirmPopVisible, setDelGroupConfirmPopVisible] = useState<boolean>(false)
    const [pluginGroupDelNoPrompt, setPluginGroupDelNoPrompt] = useState<boolean>(false)
    const delGroupConfirmPopRef = useRef<any>()

    useImperativeHandle(
        ref,
        () => ({
            groupListLen: groupList.length - 2 <= 0 ? 0 : groupList.length - 2
        }),
        [groupList]
    )

    useEffect(() => {
        getRemoteValue(RemoteGV.PluginGroupDelNoPrompt).then((result: string) => {
            setPluginGroupDelNoPrompt(result === "true")
        })
    }, [])

    return (
        <>
            <PluginGroupList
                data={groupList}
                editGroupName={editGroup.groupName}
                onEditInputBlur={(groupItem, editGroupNewName) => {
                    setEditGroup({})
                    if (!editGroupNewName || editGroupNewName === groupItem.groupName) return
                    // TODO 更新插件名
                }}
                extraOptBtn={(groupItem) => {
                    return (
                        <>
                            <YakitButton
                                icon={<OutlinePencilaltIcon />}
                                type='text2'
                                onClick={(e) => {
                                    setEditGroup(groupItem)
                                }}
                            ></YakitButton>
                            <YakitButton
                                icon={<OutlineTrashIcon />}
                                type='text'
                                colors='danger'
                                onClick={(e) => {
                                    setDelGroup(groupItem)
                                    if (!pluginGroupDelNoPrompt) {
                                        setDelGroupConfirmPopVisible(true)
                                    } else {
                                        // TODO 删除
                                    }
                                }}
                            ></YakitButton>
                        </>
                    )
                }}
            ></PluginGroupList>
            {/* 删除确认框 */}
            <DelGroupConfirmPop
                ref={delGroupConfirmPopRef}
                visible={delGroupConfirmPopVisible}
                onVisible={setDelGroupConfirmPopVisible}
                delGroupName={delGroup.groupName || ""}
                onOk={() => {
                    // TODO 删除
                    setRemoteValue(
                        RemoteGV.PluginGroupDelNoPrompt,
                        delGroupConfirmPopRef.current.delGroupConfirmNoPrompt + ""
                    )
                    setDelGroupConfirmPopVisible(false)
                }}
            ></DelGroupConfirmPop>
        </>
    )
})
