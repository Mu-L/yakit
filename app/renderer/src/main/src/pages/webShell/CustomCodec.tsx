import httpQueryStyles from "@/pages/fuzzer/HttpQueryAdvancedConfig/HttpQueryAdvancedConfig.module.scss";
import matcherStyles from "@/pages/fuzzer/MatcherAndExtractionCard/MatcherAndExtraction.module.scss";
import {YakitButton} from "@/components/yakitUI/YakitButton/YakitButton";
import {HollowLightningBoltIcon, PlusIcon, QuestionMarkCircleIcon, RemoveIcon, TrashIcon} from "@/assets/newIcon";
import React, {ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {Button, Form, Tooltip} from "antd";
import classNames from "classnames";
import {TerminalPopover} from "@/pages/fuzzer/HttpQueryAdvancedConfig/HttpQueryAdvancedConfig";
import {YakitDrawer} from "@/components/yakitUI/YakitDrawer/YakitDrawer";
import {
    defMatcherAndExtractionCode,
    MatcherAndExtraction,
    MatcherAndExtractionCard
} from "@/pages/fuzzer/MatcherAndExtractionCard/MatcherAndExtractionCard";
import {MainOperatorContext} from "@/pages/layout/MainContext";
import {YakitResizeBox} from "@/components/yakitUI/YakitResizeBox/YakitResizeBox";
import {NewHTTPPacketEditor, YakEditor} from "@/utils/editors";
import {StringToUint8Array, Uint8ArrayToString} from "@/utils/str";
import mitmStyles from "@/pages/mitm/MITMRule/MITMRule.module.scss";
import {openExternalWebsite} from "@/utils/openWebsite";
import {RuleExportAndImportButton} from "@/pages/mitm/MITMRule/MITMRule";
import {useMemoizedFn} from "ahooks";
import {YakitSelect} from "@/components/yakitUI/YakitSelect/YakitSelect";
import {WebShellDetail} from "@/pages/webShell/models";
import {InputItem, SelectOne} from "@/utils/inputUtil";
import {YakScript} from "@/pages/invoker/schema";

interface CustomCodecValueProps {
    customCodecList: string[]
}

interface CustomCodecListProps {
    customCodecValue: CustomCodecValueProps
    onAdd: () => void
    onRemove: (index: number) => void
    onEdit: (index: number) => void
}

export const CustomCodecList: React.FC<CustomCodecListProps> = React.memo((props) => {
    const {customCodecValue, onAdd, onRemove, onEdit} = props
    const {customCodecList} = customCodecValue
    return (
        <>
            <Form.Item name='customCodec' noStyle>
                {customCodecList.map((item, index) => (
                    <div className={httpQueryStyles["matchersList-item"]} key={`${item}-${index}`}>
                        <div className={httpQueryStyles["matchersList-item-heard"]}>
                            <span className={httpQueryStyles["item-number"]}>{index}</span>
                            <span style={{"color": "#f69c5d"}}>{item}</span>
                        </div>
                        <CustomCodecListItemOperate
                            onRemove={() => onRemove(index)}
                            onEdit={() => onEdit(index)}
                            popoverContent={
                                <div>111111111111</div>
                            }
                        />
                    </div>
                ))}
            </Form.Item>
            {customCodecList?.length === 0 && (
                <Form.Item wrapperCol={{span: 24}}>
                    <YakitButton
                        type='outline2'
                        onClick={() => onAdd()}
                        icon={<PlusIcon/>}
                        className={httpQueryStyles["plus-button-bolck"]}
                        block
                    >
                        添加
                    </YakitButton>
                </Form.Item>
            )}
        </>
    )
})

interface CustomCodecListItemOperateProps {
    onRemove: () => void
    onEdit: () => void
    popoverContent: ReactNode
}

const CustomCodecListItemOperate: React.FC<CustomCodecListItemOperateProps> = React.memo(
    (props) => {
        const {onRemove, onEdit, popoverContent} = props
        const [visiblePopover, setVisiblePopover] = useState<boolean>(false)
        return (
            <div
                className={classNames(httpQueryStyles["matchersList-item-operate"], {
                    [httpQueryStyles["matchersList-item-operate-hover"]]: visiblePopover
                })}
            >
                <TrashIcon className={httpQueryStyles["trash-icon"]} onClick={() => onRemove()}/>

                <Tooltip title='调试'>
                    <HollowLightningBoltIcon
                        className={httpQueryStyles["hollow-lightningBolt-icon"]}
                        onClick={() => {
                            onEdit()
                        }}
                    />
                </Tooltip>
                <TerminalPopover
                    popoverContent={popoverContent}
                    visiblePopover={visiblePopover}
                    setVisiblePopover={setVisiblePopover}
                />
            </div>
        )
    }
)

interface CustomCodecEditorProps {
    params: YakScript
    setParams: (y: YakScript) => void
    modified?: YakScript | undefined
    title: string
    visibleDrawer: boolean
    onClose: () => void
}

export const CustomCodecEditor: React.FC<CustomCodecEditorProps> = React.memo((props) => {
    const {params, setParams, modified, title, visibleDrawer, onClose} = props
    const {tabMenuHeight} = useContext(MainOperatorContext)
    const heightDrawer = useMemo(() => {
        return tabMenuHeight - 40
    }, [tabMenuHeight])
    const onOkImport = useMemoizedFn(() => {
        console.log("onOkImport")
    })
    const onSaveToDataBase = useMemoizedFn(() => {
        console.log("onSaveToDataBase")
    })
    const onExecute = useMemoizedFn(() => {
        console.log("onExecute")
    })
    return (
        <YakitDrawer
            placement='bottom'
            closable={false}
            onClose={() => onClose()}
            visible={visibleDrawer}
            mask={false}
            style={{height: visibleDrawer ? heightDrawer : 0}}
            className={classNames(mitmStyles["mitm-rule-drawer"])}
            contentWrapperStyle={{boxShadow: "0px -2px 4px rgba(133, 137, 158, 0.2)"}}
            title={<div className={mitmStyles["heard-title"]}>{title}</div>}
            extra={
                <div className={mitmStyles["heard-right-operation"]}>
                    <RuleExportAndImportButton onOkImport={onOkImport}/>
                    <YakitButton
                        type='outline1'
                        onClick={() => onExecute()}
                        className={mitmStyles["button-question"]}
                        size={"small"}
                    >
                        调试执行
                    </YakitButton>
                    <YakitButton
                        type='primary'
                        className={mitmStyles["button-save"]}
                        onClick={() => onSaveToDataBase()}
                    >
                        保存
                    </YakitButton>
                    <Tooltip title='官方网站' placement='top' overlayClassName={mitmStyles["question-tooltip"]}>
                        <YakitButton
                            type='outline2'
                            className={mitmStyles["button-question"]}
                            onClick={() => openExternalWebsite("https://www.yaklang.com/")}
                            icon={<QuestionMarkCircleIcon/>}
                        >
                        </YakitButton>
                    </Tooltip>
                    <div onClick={() => onClose()} className={mitmStyles["icon-remove"]}>
                        <RemoveIcon/>
                    </div>
                </div>
            }
        >
            <CustomEditor
                params={params}
                setParams={setParams}
                modified={modified}
                enCoder={defEncoder}
                deCoder={""}
                // onClose={onClose}
            />

        </YakitDrawer>
    )
})

interface CustomEditorProps {
    params: YakScript
    setParams: (y: YakScript) => void
    modified?: YakScript | undefined
    enCoder: string
    deCoder: string
    onClose?: () => void
}

const defEncoder = `
Encoder = (func(reqBody) {
    jsonStr := '{"id":"1","body":{"user":"lucky"}}'
    jsonStr = '{"go0p":"1",asdfakhj,"body":{"user":"lucky"}}'
    encodedData := codec.EncodeBase64(reqBody)
    //encodedData = strings.ReplaceAll(encodedData, "+", "<")
    //encodedData = strings.ReplaceAll(encodedData, "/", ">")
    encodedData = str.ReplaceAll(encodedData, "+", "go0p")
    encodedData = str.ReplaceAll(encodedData, "/", "yakit")
    jsonStr = str.ReplaceAll(jsonStr, "lucky", encodedData)
    return []byte(jsonStr)
})
`

const defDecoder = `
Decoder = (func(reqBody) {
    jsonStr := '{"id":"1","body":{"user":"lucky"}}'
    jsonStr = '{"go0p":"1",asdfakhj,"body":{"user":"lucky"}}'
    encodedData := codec.EncodeBase64(reqBody)
    //encodedData = strings.ReplaceAll(encodedData, "+", "<")
    //encodedData = strings.ReplaceAll(encodedData, "/", ">")
    encodedData = str.ReplaceAll(encodedData, "+", "go0p")
    encodedData = str.ReplaceAll(encodedData, "/", "yakit")
    jsonStr = str.ReplaceAll(jsonStr, "lucky", encodedData)
    return []byte(jsonStr)
})
`

const CustomEditor: React.FC<CustomEditorProps> = React.memo((props) => {
    const {params, setParams, modified, enCoder, deCoder, onClose} = props
    const [enCodeValue, setEnCodeValue] = useState<string>("")
    const [deCodeValue, setDeCodeValue] = useState<string>("")
    const [codeValue, setCodeValue] = useState<string>("")

    const [refreshTrigger, setRefreshTrigger] = useState<boolean>(false)
    useEffect(() => {
        setEnCodeValue(enCoder || defEncoder)
        setDeCodeValue(deCoder || defDecoder)
        setRefreshTrigger(!refreshTrigger)
    }, [enCoder])
    const [shellScript, setShellScript] = useState<string>("")

    useEffect(() => {
        // 如果 params.ShellScript 是空的，那么就设置它为 "jsp"
        if (!shellScript) {
            setShellScript("jsp");
        }
    }, []);
    return (
        <div className={matcherStyles["matching-extraction-resize-box"]} style={{display: 'flex'}}>
            <YakitResizeBox
                isVer={true}
                freeze={false}
                firstNodeStyle={{height: "50%"}}
                firstNode={
                    <YakEditor
                        noMiniMap={true} type={"yak"}
                        value={enCodeValue} setValue={setEnCodeValue}
                    />
                }
                secondNode={<YakEditor
                    noMiniMap={true} type={"yak"}
                    value={deCodeValue} setValue={setDeCodeValue}
                />}
                secondNodeStyle={{paddingTop: 5}}
                style={{"width": "50%"}}
            />
            <YakitResizeBox
                isVer={true}
                freeze={false}
                firstNodeStyle={{height: "50%"}}
                firstNode={
                    <Form
                        labelCol={{span: 5}}
                        wrapperCol={{span: 14}}
                    >
                        <SelectOne
                            disabled={!!modified}
                            label={"模块类型"}
                            data={[
                                {value: "yak", text: "Yak 原生模块"},
                                {value: "mitm", text: "MITM 模块"},
                                {value: "packet-hack", text: "Packet 检查"},
                                {value: "port-scan", text: "端口扫描插件"},
                                {value: "codec", text: "Codec 模块"},
                                {value: "nuclei", text: "nuclei Yaml模块"}
                            ]}
                            setValue={(Type) => {
                                if (["packet-hack", "codec", "nuclei"].includes(Type))
                                    setParams({
                                        ...params,
                                        Type,
                                        IsGeneralModule: false
                                    })
                                else setParams({...params, Type})
                            }}
                            value={params.Type}
                        />
                        <InputItem
                            label={"名称"}
                            required={true}
                            // setValue={(Url) => setParams({...params, Url})}
                            // value={params.Url}
                            // disable={disabled}
                        />
                        <Form.Item label={"脚本类型"} name={"脚本类型"}>
                            <YakitSelect
                                value={shellScript || "jsp"}
                                onSelect={(val) => {
                                    setShellScript(val)
                                }}
                            >
                                <YakitSelect.Option value='jsp'>JSP</YakitSelect.Option>
                                <YakitSelect.Option value='jspx'>JSPX</YakitSelect.Option>
                                <YakitSelect.Option value='php'>PHP</YakitSelect.Option>
                                <YakitSelect.Option value='asp'>ASP</YakitSelect.Option>
                                <YakitSelect.Option value='aspx'>ASPX</YakitSelect.Option>
                            </YakitSelect>
                        </Form.Item>


                    </Form>
                }
                secondNode={<YakEditor
                    noMiniMap={true} type={"yak"}
                    value={"xxxxxxxxxxxxxxxxxxxxxxxxx"} setValue={setCodeValue}
                />}
                secondNodeStyle={{paddingTop: 5}}
                style={{"width": "50%"}}
            />


        </div>
    )
})