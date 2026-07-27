export interface LogFileInfo {
  date: string
  sizeBytes: number
}

export interface LogContentDto {
  date: string
  lines: string[]
  totalLines: number
}
