export interface AuditSearchProps {
    visible: boolean
    programName: string
    onClose?: () => void
}

export interface ExtraSettingProps {
    double: boolean
    data: ExtraSettingDataProps[]
}

export interface ExtraSettingDataProps {
    key: string
    label: string
    value: string
}
